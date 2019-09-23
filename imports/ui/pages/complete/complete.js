import { Template } from 'meteor/templating'
import { Session } from '../../../api/session/Session'
import { Router } from '../../../api/routing/Router'
import '../../components/textgroup/textgroup'
import '../../components/actionButton/actionButton'
import '../../layout/navbar/navbar'
import './complete.html'

const states = {
  showResults: 'showResults',
  showPrint: 'showPrint',
  showDecision: 'showDecision'
}

Template.complete.onCreated(function () {
  const instance = this
  const currentView = Router.queryParam('v')

  if (currentView && states[ currentView ]) {
    instance.state.set('view', currentView)
  } else {
    instance.state.set('view', states.showResults)
  }

  const { sessionId } = instance.data.params
  Session.methods.results.call({ sessionId }, (err, { sessionDoc, results }) => {
    if (err) {
      return console.error(err) // TODO handle
    }
    instance.state.set('results', results)
    instance.state.set('sessionDoc', sessionDoc)
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
    return Template.getState('view') === states.showResults
  },
  showDecision () {
    return Template.getState('view') === states.showDecision
  },
  showPrint () {
    return Template.getState('view') === states.showPrint
  },
  sessionDoc () {
    return Template.getState('sessionDoc')
  }
})

Template.complete.events({
  'click .lea-showresults-forward-button' (event, templateInstance) {
    event.preventDefault()
    templateInstance.state.set('view', states.showPrint)
  },
  'click .lea-showprint-back-button' (event, templateInstance) {
    event.preventDefault()
    templateInstance.state.set('view', states.showResults)
  },
  'click .lea-showprint-forward-button' (event, templateInstance) {
    event.preventDefault()
    templateInstance.state.set('view', states.showDecision)
  },
  'click .lea-showdecision-back-button' (event, templateInstance) {
    event.preventDefault()
    templateInstance.state.set('view', states.showPrint)
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
