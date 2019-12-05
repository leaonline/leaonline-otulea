import { Template } from 'meteor/templating'
import { Session } from '../../../api/session/Session'
import { Router } from '../../../api/routing/Router'
import { Dimensions } from '../../../api/session/Dimensions'
import { LeaCoreLib } from '../../../api/core/LeaCoreLib'
import { Feedback } from '../../../api/config/Feedback'
import { ContentHost } from '../../../api/hosts/ContentHost'
import '../../components/container/container'
import '../../layout/navbar/navbar'
import './complete.html'
import { ResponseParser } from './responseParser'

const components = LeaCoreLib.components
const loaded = components.load([
  components.template.actionButton,
  components.template.textGroup
])

const states = {
  showResults: 'showResults',
  showPrint: 'showPrint',
  showDecision: 'showDecision'
}
const _states = Object.values(states)

Template.complete.onCreated(function () {
  const instance = this
  const { sessionId } = instance.data.params

  // basic routes / state handling
  instance.autorun(() => {
    const data = Template.currentData()
    const v = data.queryParams.v || 0
    const currentView = _states[parseInt(v, 10)]

    if (currentView && states[currentView]) {
      instance.state.set('view', currentView)
    } else {
      instance.state.set('view', states.showResults)
    }
  })

  // call the sessionDoc first, so we can already display
  // navbar, category / dimension and some messages
  instance.autorun(() => {
    const sessionSub = Session.publications.current.subscribe({ sessionId })
    if (sessionSub.ready()) {
      const sessionDoc = Session.helpers.byId(sessionId)
      if (!sessionDoc) {
        instance.state.set('failed', new Error(`sessionDoc not found by id ${sessionId}`))
      }

      const dimension = Dimensions.types[sessionDoc.dimension]
      instance.state.set('currentType', dimension && dimension.type)
      instance.state.set('sessionDoc', sessionDoc)
    }
  })

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
        return
      }

      const { results } = res
      const { userResponse } = results
      try {
        const lines = userResponse.split('\n')
        lines.shift()
        const feedback = ResponseParser.parse(lines)
        const hasFeedback = {}
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
})

Template.complete.helpers({
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
  showResults () {
    if (!loaded.get()) return false
    const instance = Template.instance()
    return instance.state.get('view') === states.showResults
  },
  showDecision () {
    if (!loaded.get()) return false
    const instance = Template.instance()
    return instance.state.get('sessionDoc') &&
      instance.state.get('view') === states.showDecision
  },
  showPrint () {
    if (!loaded.get()) return false
    const instance = Template.instance()
    return instance.state.get('sessionDoc') &&
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
    if (templateInstance.state.get('failed')) {
      Router.queryParam({ v: _states.indexOf(states.showDecision) })
    } else {
      Router.queryParam({ v: _states.indexOf(states.showPrint) })
    }
  },
  'click .lea-showprint-back-button' (event, templateInstance) {
    event.preventDefault()
    Router.queryParam({ v: _states.indexOf(states.showResults) })
  },
  'click .lea-showprint-forward-button' (event, templateInstance) {
    event.preventDefault()
    Router.queryParam({ v: _states.indexOf(states.showDecision) })
  },
  'click .lea-showdecision-back-button' (event, templateInstance) {
    event.preventDefault()
    if (templateInstance.state.get('failed')) {
      Router.queryParam({ v: _states.indexOf(states.showResults) })
    } else {
      Router.queryParam({ v: _states.indexOf(states.showPrint) })
    }
  },
  'click .lea-end-button' (event, templateInstance) {
    event.preventDefault()
    const route = templateInstance.data.end()
    Router.go(route)
  },
  'click .lea-continue-button' (event, templateInstance) {
    event.preventDefault()
    const route = templateInstance.data.next()
    Router.go(route)
  }
})
