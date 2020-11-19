import { Template } from 'meteor/templating'
import { Session } from '../../../contexts/session/Session'
import { Feedback } from '../../../api/config/Feedback'
import { ContentHost } from '../../../api/hosts/ContentHost'
import { ResponseParser } from './responseParser'
import { Dimension } from '../../../contexts/Dimension'

import '../../components/container/container'
import '../../layout/navbar/navbar'
import './complete.html'

const states = {
  showResults: 'showResults',
  showPrint: 'showPrint',
  showDecision: 'showDecision',
  showFailed: 'showFailed'
}
const stateValues = Object.values(states)

Template.complete.onCreated(function () {
  const instance = this

  const { api } = instance.initDependencies({
    language: true,
    tts: true,
    contexts: [Dimension],
    onComplete () {
      instance.state.set('dependenciesComplete', true)
    }
  })

  const { queryParam } = api

  // basic routes / state handling
  instance.autorun(() => {
    const v = queryParam('v') || 0
    const currentView = stateValues[parseInt(v, 10)]

    if (currentView && states[currentView]) {
      instance.state.set('view', currentView)
    } else {
      instance.state.set('view', states.showResults)
    }
  })

  const onFailed = err => instance.state.set('failed', err || true)
  onFailed()

  /*
  const { sessionId } = instance.data.params

  instance.autorun(() => {
    const sessionDoc = instance.state.get('sessionDoc')
    if (!sessionDoc) return

    Session.methods.results.call({ sessionId }, (err, res) => {
      if (err) {
        instance.state.set('failed', err)
        return console.error(err)
      }
      // if we can't get anything out of the response
      // we set the internal state to failed
      if (!res || !res.results || !res.results.userResponse) {
        const noResErr = new Error(`Expected result from ${Session.methods.results.name}`)
        instance.state.set('failed', noResErr)
        console.error(noResErr)
        console.info(res)
        return
      }

      const { results } = res
      const { userResponse } = results
      try {
        const lines = userResponse.split('\n')
        lines.shift()

        const hasFeedback = {}
        const feedback = ResponseParser.parse(lines)
        feedback.forEach(entry => {
          hasFeedback[entry.status] = true
        })

        instance.state.set('results', results)
        instance.state.set('currentFeedback', feedback)
        instance.state.set('hasFeedback', hasFeedback)
      } catch (e) {
        instance.state.set('failed', e)
      }
    })
  })

  // if we have a current feedback id-list
  // we can load the feedback-translations
  // from the remote content server
  const toIds = entry => entry.competencyId
  instance.autorun(() => {
    const feedback = instance.state.get('currentFeedback')
    if (!feedback) return

    ContentHost.methods.getCompetencies(feedback.map(toIds), (err, competencies) => {
      if (err) {
        instance.state.set('failed', err)
        return console.error(err)
      }
      const mappedCompetencies = {}
      competencies.forEach(entry => {
        mappedCompetencies[entry.competencyId] = entry
      })
      instance.state.set('competencies', mappedCompetencies)
      instance.state.set('competenciesLoaded', true)
    })
  })

  // finally we call all feedback categories once
  Feedback.methods.get.call((err, res) => {
    if (err) {
      instance.state.set('failed', err)
      console.error(err)
      return
    }
    if (!res) {
      const noResErr = new Error(`Expected result from ${Feedback.methods.get.name}`)
      instance.state.set('failed', noResErr)
      console.error(noResErr)
      return
    }
    const { notEvaluable, levels } = res
    if (!levels) {
      const noLevelsErr = new Error('no levels')
      instance.state.set('failed', noLevelsErr)
      console.error(noLevelsErr)
      return
    }
    levels.unshift(notEvaluable)
    const feedbackLevels = levels && levels.map((text, index) => ({ text, index: index - 1 })).reverse()
    instance.state.set('feedbackLevels', feedbackLevels)
  })

  */
})

Template.complete.helpers({
  loadComplete () {
    return Template.getState('dependenciesComplete')
  },
  failed () {
    return Template.getState('failed')
  },
  competency (id) {
    const competencies = Template.getState('competencies')
    return competencies && competencies[id]
  },
  feedbackLevels () {
    return Template.getState('feedbackLevels')
  },
  hasFeedback (index) {
    const map = Template.getState('hasFeedback')
    return map && map[index]
  },
  competenciesLoaded () {
    return Template.getState('competenciesLoaded')
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
  showPrint () {
    const instance = Template.instance()
    const failed = instance.state.get('failed')
    return !failed &&
      instance.state.get('sessionDoc') &&
      instance.state.get('view') === states.showPrint
  },
  sessionDoc () {
    return Template.getState('sessionDoc')
  },
  currentType () {
    return Template.getState('currentType')
  }
})

Template.complete.events({
  'click .lea-showresults-forward-button' (event, templateInstance) {
    event.preventDefault()
    const { queryParam } = templateInstance.api
    if (templateInstance.state.get('failed')) {
      queryParam({ v: stateValues.indexOf(states.showDecision) })
    } else {
      queryParam({ v: stateValues.indexOf(states.showPrint) })
    }
  },
  'click .lea-showprint-back-button' (event, templateInstance) {
    event.preventDefault()
    const { queryParam } = templateInstance.api
    queryParam({ v: stateValues.indexOf(states.showResults) })
  },
  'click .lea-showprint-forward-button' (event, templateInstance) {
    event.preventDefault()
    const { queryParam } = templateInstance.api
    queryParam({ v: stateValues.indexOf(states.showDecision) })
  },
  'click .lea-showdecision-back-button' (event, templateInstance) {
    event.preventDefault()
    const { queryParam } = templateInstance.api
    if (templateInstance.state.get('failed')) {
      queryParam({ v: stateValues.indexOf(states.showResults) })
    } else {
      queryParam({ v: stateValues.indexOf(states.showPrint) })
    }
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
