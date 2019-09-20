import { Session } from '../../../api/session/Session'
import { Router } from '../../../api/routing/Router'
import '../../components/textgroup/textgroup'
import '../../components/actionButton/actionButton'
import './complete.html'

Template.complete.onCreated(function () {
  const instance = this

  const { sessionId } = instance.data.params
  Session.methods.results.call({sessionId}, (err, results) => {
    if (err) {
      return console.error(err) // TODO handle
    }
    instance.state.set('results', results)
  })
})

Template.complete.helpers({
  printOptions() {
    return Template.getState('printOptions')
  },
  evaluationResults () {
    return Template.getState('results')
  }
})

Template.complete.events({
  'click .lea-complete-forward-button' (event, templateInstance) {
    event.preventDefault()
    const route = templateInstance.data.next()
    Router.go(route)
  }
})
