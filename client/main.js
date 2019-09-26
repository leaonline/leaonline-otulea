import '../imports/startup/client/serviceWorker'
import '../imports/startup/client/language'
import '../imports/startup/client/schema'
import '../imports/startup/client/bootstrap'
import '../imports/startup/client/fontawesome'
import '../imports/startup/client/routes'
import '../imports/startup/client/routeHelpers'
import '../imports/startup/client/leaconfig'
import '../imports/startup/client/session'

import { Template } from 'meteor/templating'
import footerLogos from '../resources/lea/footerLogos.json'
import '../imports/ui/components/image/image'
import './main.scss'
import './main.html'

const mapSource = logo => {
  logo.src = `/logos/${logo.name}`
  return logo
}
const mappedLogos = footerLogos.map(mapSource)

Template[ 'main-render-target' ].helpers({
  logos () {
    return mappedLogos
  }
})

Template[ 'main-render-target' ].events({
  'click .logout-button' (event, templateInstance) {
    event.preventDefault()
    Meteor.logout(err => {
      if (err) {
        console.error(err)
      }
      window.location.reload()
    })
  }
})
