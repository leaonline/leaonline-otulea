import { Template } from 'meteor/templating'
import { ReactiveDict } from 'meteor/reactive-dict'
import { Dimension } from '../../../contexts/Dimension'
import { Session } from '../../../contexts/session/Session'
import { Competency } from '../../../contexts/Competency'
import { Feedback } from '../../../contexts/feedback/Feedback'
import { feedbackLevelFactory } from '../../../contexts/feedback/feedbackLevelFactory'
import { createSessionLoader } from '../../../api/loading/createSessionLoader'
import { printHTMLElement } from '../../utils/printHTMLElement'
import '../../components/container/container'
import '../../layout/navbar/navbar'
import './complete.html'
import { sessionIsComplete } from '../../../contexts/session/utils/sessionIsComplete'

const states = {
  showResults: 'showResults',
  showDecision: 'showDecision',
  showFailed: 'showFailed'
}

const stateValues = Object.values(states)

Template.complete.onCreated(function () {
  const instance = this
  instance.resolvedFeedback = new ReactiveDict()
  const { sessionId } = instance.data.params

  const { api } = instance.initDependencies({
    language: true,
    tts: true,
    contexts: [Dimension, Session, Competency, Feedback],
    onComplete () {
      instance.state.set({
        dependenciesComplete: true
      })
    }
  })

  const { queryParam, callMethod, loadAllContentDocs, info, hasProperty } = api
  const onFailed = err => instance.state.set('failed', err || true)

  // we use the session loader to simply the loading of the session dependencies
  // such as Dimension, Level, UnitSet, Colors, Unit etc.
  const sessionLoader = createSessionLoader({ info })
  sessionLoader({ sessionId })
    .catch(err => onFailed(err))
    .then(sessionData => {
      info(sessionData)

      const { sessionDoc, unitSetDoc, dimensionDoc, levelDoc, color } = sessionData
      // first we check for all docs, even one left-out doc is not acceptable
      if (!sessionDoc || !unitSetDoc || !dimensionDoc || !levelDoc) {
        return // we can safely skip since this information is not viable
      }

      // if we encounter a sessionDoc that is not completed, we just
      // skip any further attempts to load and immediately exit
      if (!sessionIsComplete(sessionDoc)) {
        return instance.data.exit({ sessionId })
      }

      // otherwise we're good and can continue with the current session
      instance.state.set({
        sessionDoc,
        dimensionDoc,
        levelDoc,
        unitSetDoc,
        color,
        sessionLoaded: true
      })
    })

  // basic routes / state handling
  instance.autorun(() => {
    const v = queryParam('v') || 0
    const currentView = stateValues[parseInt(v, 10)]

    if (currentView && hasProperty(states, currentView)) {
      instance.state.set('view', currentView)
    }

    else {
      instance.state.set('view', states.showResults)
    }
  })

  // first we call for the feedback levels and their respective configurations
  callMethod({
    name: Feedback.methods.get,
    args: {},
    failure: err => onFailed(err),
    success: feedbackDoc => {
      instance.state.set({ feedbackDoc })
    }
  })

  callMethod({
    name: Session.methods.results,
    args: { sessionId },
    failure: err => onFailed(err),
    success: res => {
      const aggregatedCompetencies = new Map()
      console.info(res)
      res.forEach(result => {
        result.forEach(({ competency, score, isUndefined }) => {
          const current = aggregatedCompetencies.get(competency) || {
            limit: 0,
            count: 0,
            undef: 0
          }

          current.limit += 1
          current.count += (score === 'true' ? 1 : 0)
          current.undef += (isUndefined === 'true' ? 1 : 0)

          aggregatedCompetencies.set(competency, current)
        })
      })
      console.info(aggregatedCompetencies)
      // GET request to content server to fetch competency documents
      // which are required to display the related texts
      const ids = Array.from(aggregatedCompetencies.keys())
      loadAllContentDocs(Competency, { ids })
        .catch(error => onFailed(error))
        .then(competencyDocs => {
          if (competencyDocs.length === 0) {
            instance.state.set('competenciesLoaded', true)
            return onFailed()
          }

          instance.state.set('aggregatedResults', Object.fromEntries(aggregatedCompetencies.entries()))
          instance.state.set('competenciesLoaded', true)
        })
    }
  })

  instance.autorun(() => {
    const feedbackDoc = instance.state.get('feedbackDoc')
    const aggregatedResults = instance.state.get('aggregatedResults')

    if (!aggregatedResults || !feedbackDoc) return

    // if both are loaded we can resolve competencies by thresholds and
    // build a fixed structure to be returned to the template view to render

    const getFeedbackIndex = feedbackLevelFactory(feedbackDoc)
    const { resolvedFeedback } = instance
    resolvedFeedback.clear()

    Object.entries(aggregatedResults).forEach(([competencyId, result]) => {
      const index = getFeedbackIndex(result)
      let indices = Tracker.nonreactive(() => resolvedFeedback.get(index))
      if (!indices) {
        indices = []
      }

      indices.push(competencyId)
      resolvedFeedback.set(index, indices)
    })
  })
})

Template.complete.helpers({
  loadComplete () {
    const instance = Template.instance()
    return instance.state.get('dependenciesComplete') &&
      instance.state.get('competenciesLoaded') &&
      instance.state.get('sessionLoaded')
  },
  failed () {
    return Template.getState('failed')
  },
  feedbackLevels () {
    const feedbackDoc = Template.getState('feedbackDoc')
    return feedbackDoc?.levels
  },
  getCompetencies (index) {
    return Template.instance().resolvedFeedback.get(index)
  },
  competenciesLoaded () {
    return Template.getState('competenciesLoaded')
  },
  getCompetency (_id) {
    const competencyDoc = Competency.collection().findOne(_id)
    if (competencyDoc) {
      return {
        description: competencyDoc.descriptionSimple || competencyDoc.description,
        example: competencyDoc.example
      }
    }

    return { description: _id }
  },
  getFeedback (index) {
    const feedback = Template.getState('currentFeedback')
    return feedback && feedback.filter(entry => entry.status === index)
  },
  printOptions () {
    return Template.getState('printOptions')
  },
  evaluationResults () {
    return Template.getState('results')
  },
  showThanks () {
    const viewState = Template.getState('view')
    const failed = Template.getState('failed')
    return viewState === states.showResults || failed
  },
  showResults () {
    const instance = Template.instance()
    const failed = instance.state.get('failed')
    return instance.state.get('view') === states.showResults && !failed
  },
  showDecision () {
    const instance = Template.instance()
    const failed = instance.state.get('failed')
    return !failed &&
      instance.state.get('sessionDoc') &&
      instance.state.get('view') === states.showDecision
  },
  navbarData () {
    const instance = Template.instance()
    const sessionDoc = instance.state.get('sessionDoc')
    const levelDoc = instance.state.get('levelDoc')
    const unitSetDoc = instance.state.get('unitSetDoc')
    const dimensionDoc = instance.state.get('dimensionDoc')

    return {
      sessionDoc,
      levelDoc,
      unitSetDoc,
      dimensionDoc,
      showProgress: false,
      showUsername: true,
      onExit: instance.data.exit
    }
  },
  currentType () {
    return Template.instance().state.get('color')
  }
})

Template.complete.events({
  'click .lea-showresults-forward-button' (event, templateInstance) {
    event.preventDefault()
    const { queryParam } = templateInstance.api
    queryParam({ v: stateValues.indexOf(states.showDecision) })
  },
  'click .lea-showdecision-back-button' (event, templateInstance) {
    event.preventDefault()
    const { queryParam } = templateInstance.api
    queryParam({ v: stateValues.indexOf(states.showResults) })
  },
  'click .print-simple' (event) {
    event.preventDefault()
    printHTMLElement('lea-complete-print-root')
  },
  'click .lea-end-button' (event, templateInstance) {
    event.preventDefault()
    templateInstance.api.fadeOut('.lea-complete-container', () => templateInstance.data?.end())
  },
  'click .lea-continue-button' (event, templateInstance) {
    event.preventDefault()
    templateInstance.api.fadeOut('.lea-complete-container', () => templateInstance.data?.next())
  },
  'click .lea-to-overview-button' (event, templateInstance) {
    event.preventDefault()
    templateInstance.api.fadeOut('.lea-complete-container', () => templateInstance.data?.next())
  }
})
