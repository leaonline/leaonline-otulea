import { Template } from 'meteor/templating'
import { Legal } from '../../../api/config/Legal'
import { dataTarget } from '../../../utils/eventUtils'
import { Logos } from '../../../api/config/Logos'
import '../../components/image/image'
import '../../components/soundbutton/soundbutton'
import './footer.html'

const mapSource = logo => {
  logo.src = `/logos/${logo.name}`
  return logo
}
const legalRoutes = Object.keys(Legal.schema).map(key => {
  const value = Legal.schema[ key ]
  return {
    name: key,
    label: value.label
  }
})

const legalData = {}

Template.footer.onCreated(function () {
  const instance = this

  Logos.methods.get.call((err, logoDoc) => {
    instance.state.set('logoDoc', logoDoc)
  })
})

Template.footer.helpers({
  logos () {
    const logoDoc = Template.getState('logoDoc')
    return logoDoc && logoDoc.footerLogos
  },
  legalRoutes () {
    return legalRoutes
  },
  currentLegalData () {
    const key = Template.getState('currentLegalData')
    return legalData[ key ]
  },
  currentLegalLabel () {
    const key = Template.getState('currentLegalData')
    return key && Legal.schema[key].label
  }
})

Template.footer.events({
  'click .logout-button' (event, templateInstance) {
    event.preventDefault()
    Meteor.logout(err => {
      if (err) {
        console.error(err)
      }
      window.location.reload()
    })
  },
  'click .legal-link' (event, templateInstance) {
    event.preventDefault()

    const key = dataTarget(event, templateInstance, 'key')

    if (legalData[ key ]) {
      templateInstance.state.set('currentLegalData', key)
    } else {
      Legal.methods.get.call(key, (err, content) => {
        legalData[ key ] = content
        templateInstance.state.set('currentLegalData', key)
      })
    }

    templateInstance.$('#legalContentModal').modal('show')
  }
})
