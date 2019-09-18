import { Template } from 'meteor/templating'
import { dataTarget } from '../../../utils/eventUtils'
import { loggedIn } from '../../../utils/accountUtils'
import '../../components/textgroup/textgroup'
import '../../components/actionButton/actionButton'
import './notFound.html'

Template.notFound.helpers({
  hideDecision () {
    if (!loggedIn()) return true
    return Template.getState('hideDecision')
  }
})

Template.notFound.events({
  'click .lea-not-found-decision-button' (event, templateInstance) {
    event.preventDefault()
    const decision = dataTarget(event, templateInstance, 'decision')
    if (decision) {
      // TODO SEND NOT FOUND ERROR HERE
    } else {
      templateInstance.state.set('hideDecision', true)
    }
  }
})