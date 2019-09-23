import './navbar.html'
import { Dimensions } from '../../../api/session/Dimensions'
import { Routes } from '../../../api/routing/Routes'
import { fadeOut } from '../../../utils/animationUtils'

const _dimensions = Object.values(Dimensions)

Template.navbar.helpers({
  showProgress () {
    return Template.instance().data.showProgress !== false
  },
  currentTaskCount () {
    return 0
  },
  maxTaskCount () {
    return 0
  },
  dimensionLabel () {
    return ''
  },
  levelLabel () {
    return ''
  },
  dimensions () {
    return _dimensions
  }
})

Template.navbar.events({
  'click .navbar-overview-button' (event, templateInstance) {
    event.preventDefault()
    const root=templateInstance.data.root
    const route = Routes.overview
    if (root) {
      fadeOut(root, {$}, () => {
        Router.go(route)
      })
    } else {
      Router.go(route)
    }
  }
})
