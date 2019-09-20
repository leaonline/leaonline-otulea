import { Template } from 'meteor/templating'
import { Router } from '../../../api/routing/Router'
import { fadeOut } from '../../../utils/animationUtils'
import '../../components/textgroup/textgroup'
import '../../components/actionButton/actionButton'
import './notFound.html'

Template.notFound.events({
  'click .lea-pagenotfound-button' (event, templateInstance) {
    event.preventDefault()

    fadeOut('.lea-pagenotfound-container', templateInstance, () => {
      const route = templateInstance.data.next()
      Router.go(route)
    })
  }
})
