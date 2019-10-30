import { Template } from 'meteor/templating'
import { Router } from '../../../api/routing/Router'
import { fadeOut } from '../../../utils/animationUtils'
import { LeaCoreLib } from '../../../api/core/LeaCoreLib'
import './notFound.html'

const components = LeaCoreLib.components
const loaded = components.load([
  components.template.actionButton,
  components.template.textGroup
])

Template.notFound.helpers({
  loadComplete () {
    return loaded.get()
  }
})

Template.notFound.events({
  'click .lea-pagenotfound-button' (event, templateInstance) {
    event.preventDefault()

    fadeOut('.lea-pagenotfound-container', templateInstance, () => {
      const route = templateInstance.data.next()
      Router.go(route)
    })
  }
})
