import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { Session } from '../../../api/session/Session'
import { Router } from '../../../api/routing/Router'
import { Dimensions } from '../../../api/session/Dimensions'
import { LeaCoreLib } from '../../../api/core/LeaCoreLib'

import '../../components/container/container'
import '../../layout/navbar/navbar'
import './complete.html'
import { Feedback } from '../../../api/config/Feedback'

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

  let dimension
  instance.autorun(() => {
    if (!loaded) return

    // fix to immediately display the navbar
    const alreadyExistingSessionDoc = Session.helpers.byId(sessionId)
    if (alreadyExistingSessionDoc) {
      dimension = Dimensions.types[ alreadyExistingSessionDoc.dimension ]
      instance.state.set('currentType', dimension && dimension.type)
      instance.state.set('sessionDoc', alreadyExistingSessionDoc)
    }

    Session.methods.results.call({ sessionId }, (err, { sessionDoc, results }) => {
      if (err) {
        return console.error(err) // TODO handle
      }

      const { userResponse } = results
      const lines = userResponse.split('\n')
      const hasFeedback = {}
      const feedback = lines.map(line => {
        const split = line.split(/\s+/g)
        const value = parseInt(split[ 2 ], 10)
        hasFeedback[ value ] = true
        return {
          id: split[ 1 ],
          value: value
        }
      })

      dimension = Dimensions.types[ sessionDoc.dimension ]
      instance.state.set('currentType', dimension && dimension.type)
      instance.state.set('results', results)
      instance.state.set('sessionDoc', sessionDoc)
      instance.state.set('currentFeedback', feedback)
      instance.state.set('hasFeedback', hasFeedback)
    })
  })

  instance.autorun(() => {
    const data = Template.currentData()
    const v = data.queryParams.v || 0
    const currentView = _states[ parseInt(v, 10) ]

    if (currentView && states[ currentView ]) {
      instance.state.set('view', currentView)
    } else {
      instance.state.set('view', states.showResults)
    }
  })

  instance.autorun(() => {
    const feedback = instance.state.get('currentFeedback')
    if (!feedback) return

    // TODO load feedback from server
  })

  Feedback.methods.get.call((err, { levels }) => {
    if (err) {
      // TODO set state to "eval currently unavailable"
      console.error(err)
      return
    }
    instance.state.set('feedbackLevels', levels && levels.map((text, index) => ({ text, index })).reverse())
  })
})

Template.complete.helpers({
  feedbackLevels () {
    return Template.getState('feedbackLevels')
  },
  hasFeedback (index) {
    const map = Template.getState('hasFeedback')
    return map && map[ index ]
  },
  getFeedback (index) {
    const feedback = Template.getState('currentFeedback')
    return feedback && feedback.filter(entry => entry.value === index)
  },
  printOptions () {
    return Template.getState('printOptions')
  },
  evaluationResults () {
    return Template.getState('results')
  },
  showResults () {
    const instance = Template.instance()
    return instance.state.get('view') === states.showResults
  },
  showDecision () {
    const instance = Template.instance()
    return instance.state.get('sessionDoc') &&
      instance.state.get('view') === states.showDecision
  },
  showPrint () {
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
    Router.queryParam({ v: _states.indexOf(states.showPrint) })
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
    Router.queryParam({ v: _states.indexOf(states.showPrint) })
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
