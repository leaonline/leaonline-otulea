import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { Legal } from '../../../contexts/legal/Legal' // TODO load dynamic  depending on i18n locale
import settings from '../../../../resources/i18n/i18n_routes'
import './legal.html'

Template.legal.onCreated(function () {
  const instance = this
  instance.initDependencies({
    language: true,
    tts: true,
    onComplete: () => {
      instance.state.set('dependenciesComplete', true)
    }
  })

  instance.autorun(() => {
    const data = Template.currentData()
    const { type } = data.params
    let originalType

    Object.entries(settings.legal).forEach(([key, value]) => {
      if (type === value) {
        originalType = key
      }
    })

    if (!originalType) {
      instance.state.set({
        error: new Error('unknown legal key') // TODO translate
      })
    }

    Meteor.call(Legal.methods.get.name, { name: originalType }, (err, res) => {
      if (err) return console.error(err) // TODO LOG AS FATAL!

      const content = (res || '').split(/\n\s*\n/g).map(line => line.split(/\n+/g))
      console.info(content)

      instance.state.set({ type: originalType, content })
    })
  })
})

Template.legal.helpers({
  allComplete () {
    return Template.getState('dependenciesComplete') && Template.getState('content')
  },
  dependenciesComplete () {
    return Template.getState('dependenciesComplete')
  },
  content () {
    return Template.getState('content')
  },
  legalTitle () {
    const type = Template.getState('type')
    return `legal.${type}`
  }
})
