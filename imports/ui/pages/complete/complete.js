import { Template } from 'meteor/templating'
import { Session } from '../../../api/session/Session'
import { Router } from '../../../api/routing/Router'
import '../../components/textgroup/textgroup'
import '../../components/actionButton/actionButton'
import '../../layout/navbar/navbar'
import './complete.html'
import { Dimensions } from '../../../api/session/Dimensions'

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
    const dimension = Dimensions[ sessionDoc.dimension ]

    instance.state.set('results', results)
    instance.state.set('currentType', dimension && dimension.type)
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
