import { Template } from 'meteor/templating'
import { Session } from '../../../api/session/Session'
import { Router } from '../../../api/routing/Router'
import { Dimensions } from '../../../api/session/Dimensions'

import '../../components/container/container'
import '../../layout/navbar/navbar'
import './complete.html'
import { LeaCoreLib } from '../../../api/core/LeaCoreLib'

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

  instance.autorun(() => {
    if (!loaded) return

    Session.methods.results.call({ sessionId }, (err, { sessionDoc, results }) => {
      if (err) {
        return console.error(err) // TODO handle
      }
      const dimension = Dimensions.types[sessionDoc.dimension]

      instance.state.set('results', results)
      instance.state.set('currentType', dimension && dimension.type)
      instance.state.set('sessionDoc', sessionDoc)
    })
  })

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
})

Template.complete.helpers({
  printOptions () {
    return Template.getState('printOptions')
  },
  evaluationResults () {
    return Template.getState('results')
  },
  showResults () {
    const instance = Template.instance()
    return instance.state.get('sessionDoc') &&
      instance.state.get('view') === states.showResults
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
