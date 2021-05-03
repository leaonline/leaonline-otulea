import { Template } from 'meteor/templating'
import { Tracker } from 'meteor/tracker'
import { ReactiveDict } from 'meteor/reactive-dict'
import { Dimension } from '../../../contexts/Dimension'
import { Session } from '../../../contexts/session/Session'
import { Thresholds } from '../../../contexts/thresholds/Thresholds'
import { Competency } from '../../../contexts/Competency'
import { createSessionLoader } from '../../loading/createSessionLoader'
import { printHTMLElement } from '../../utils/printHTMLElement'
import { sessionIsComplete } from '../../../contexts/session/utils/sessionIsComplete'
import { getGradeForCompetency } from '../../../contexts/thresholds/api/getGradeForCompetency'
import '../../components/container/container'
import '../../layout/navbar/navbar'
import './complete.html'

const states = {
  showResults: 'showResults',
  showDecision: 'showDecision',
  showFailed: 'showFailed'
}

const stateValues = Object.values(states)

Template.complete.onCreated(function () {
  const instance = this
  const { sessionId } = instance.data.params

  const { api } = instance.initDependencies({
    language: true,
    tts: true,
    contexts: [Dimension, Session, Competency, Thresholds],
    onComplete () {
      instance.state.set({
        dependenciesComplete: true
      })
    }
  })

  const { queryParam, callMethod, loadContentDoc, loadAllContentDocs, info, debug, hasProperty } = api
  const onFailed = err => instance.state.set('failed', err || true)

  loadAllContentDocs(Thresholds, undefined, debug)
    .catch(e => console.error(e))
    .then(() => {
      const thresholdDoc = Thresholds.collection().findOne()
      const {
        minCountCompetency,
        thresholdsCompetency,
        thresholdsAlphaLevel
      } = thresholdDoc

      const sortedThresholds = Object
        .entries(thresholdsCompetency)
        .map(([key, value]) => {
          return {
            max: value,
            name: key
          }
        })
        .sort((a, b) => {
          return b.max - a.max
        })

      instance.state.set(thresholdDoc)

      // TODO refactor into own method
      callMethod({
        name: Session.methods.results,
        args: { sessionId },
        failure: err => onFailed(err),
        success: res => {
          if (!res) {
            return onFailed() // TODO fallback with a message "we can't eval right now..."
          }

          const aggregatedCompetencies = new Map()
          res.forEach(result => {
            result.forEach(({ competency, score, isUndefined }) => {
              // since competency can actually hold more than one competency we
              // need another iteration to break it down to it's pieces
              competency.forEach(competencyId => {
                const current = aggregatedCompetencies.get(competencyId) || {
                  limit: 0,
                  count: 0,
                  undef: 0,
                  min: minCountCompetency,
                  perc: 0
                }

                current.limit += 1
                current.count += (score === 'true' ? 1 : 0)
                current.undef += (isUndefined === 'true' ? 1 : 0)
                current.perc = (current.count / current.limit) * 100
                current.grade = getGradeForCompetency({
                  count: current.limit,
                  minCount: minCountCompetency,
                  correct: current.count,
                  thresholds: sortedThresholds
                })
                current.grade.label = `thresholds.${current.grade.name}`
                current.isGraded = current.grade.index > -1
                aggregatedCompetencies.set(competencyId, current)
              })
            })
          })

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

              const CompetencyCollection = Competency.collection()
              aggregatedCompetencies.forEach((value, competencyId) => {
                const competencyDoc = CompetencyCollection.findOne(competencyId)
                if (!competencyDoc) {
                  return console.warn('Found no competency doc for _id', competencyId)
                }

                value.shortCode = competencyDoc.shortCode
                value._id = competencyId
                aggregatedCompetencies.set(competencyId, value)
              })

              debug({ aggregatedCompetencies })

              const aggregatedResults = Array
                .from(aggregatedCompetencies.values())
                .sort((a, b) => a.shortCode.localeCompare(b.shortCode))
              instance.state.set({
                aggregatedResults,
                competenciesLoaded: true
              })
            })
        }
      })
    })

  // we use the session loader to simply the loading of the session dependencies
  // such as Dimension, Level, UnitSet, Colors, Unit etc.
  const sessionLoader = createSessionLoader({ info })
  sessionLoader({ sessionId })
    .catch(err => onFailed(err))
    .then(sessionData => {
      debug(sessionData)

      if (!sessionData) return console.warn('no session data!')

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
  competenciesLoaded () {
    return Template.getState('competenciesLoaded')
  },
  competencies () {
    return Template.getState('aggregatedResults')
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
  minCountCompetency () {
    return Template.getState('minCountCompetency')
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
