import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { Legal } from '../../../contexts/legal/Legal'
import { Logos } from '../../../contexts/logos/Logos'
import { dataTarget } from '../../../utils/dataTarget'
import './footer.scss'
import './footer.html'

const legalRoutes = Object.keys(Legal.schema).map(key => {
  const value = Legal.schema[key]
  return {
    name: key,
    label: value.label
  }
})

const legalData = {}

Template.footer.onCreated(function () {
  const instance = this

  instance.initDependencies({
    tts: true,
    language: true,
    onComplete () {
      instance.state.set('dependenciesComplete', true)
    }
  })

  Logos.methods.get.call((err, logoDoc) => {
    if (err) console.error(err)
    instance.state.set('logoDoc', logoDoc)
  })
})

Template.footer.helpers({
  loadComplete () {
    return Template.getState('dependenciesComplete')
  },
  logos () {
    const logoDoc = Template.getState('logoDoc')
    return logoDoc && logoDoc.footer
  },
  legalRoutes () {
    Template.getState('dependenciesComplete')
    return legalRoutes
  },
  currentLegalData () {
    const key = Template.getState('currentLegalData')
    return legalData[key]
  },
  currentLegalLabel () {
    const key = Template.getState('currentLegalData')
    return key && Legal.schema[key].label
  }
})

Template.footer.events({
  'click .logout-button' (event) {
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

    const key = dataTarget(event, 'key')

    if (legalData[key]) {
      templateInstance.state.set('currentLegalData', key)
    }
    else {
      Legal.methods.get.call(key, (err, content) => {
        if (err) return console.error(err)
        legalData[key] = content
        templateInstance.state.set('currentLegalData', key)
      })
    }

    templateInstance.$('#legalContentModal').modal('show')
  }
})
