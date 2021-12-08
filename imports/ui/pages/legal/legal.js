import { Meteor } from 'meteor/meteor'
import { Blaze } from 'meteor/blaze'
import { Template } from 'meteor/templating'
import { Legal } from '../../../contexts/legal/Legal' // TODO load dynamic  depending on i18n locale
import settings from '../../../../resources/i18n/de/routes'
import legalLanguage from './i18n/legalLanguage'
import { marked } from 'marked'
import 'meteor/leaonline:ui/components/soundbutton/soundbutton'
import './legal.html'
import { i18n } from '../../../api/i18n/I18n'

Template.legal.onCreated(function () {
  const instance = this
  instance.initDependencies({
    contexts: [Legal],
    translations: legalLanguage,
    tts: true,
    onComplete: () => {
      instance.state.set('dependenciesComplete', true)
    }
  })

  let count = 0
  const renderer = {
    text (text /*, level */) {
      const transformed = text
        .replace(/§§/g, i18n.get('pages.legal.paragraphs'))
        .replace(/§/g, i18n.get('pages.legal.paragraph'))

      const id = `sound-${count++}`
      setTimeout(() => {
        const parent = document.querySelector(`#${id}`)
        Blaze.renderWithData(Template.soundbutton, {
          text: transformed,
          outline: true,
          sm: true,
          type: 'secondary',
          class: 'border-0'
        }, parent)
      }, 1000)
      return `<span><span id="${id}"></span>${text}</span>`
    }
  }

  marked.use({ renderer })

  instance.autorun(() => {
    const dependenciesComplete = instance.state.get('dependenciesComplete')
    if (!dependenciesComplete) { return }

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
        error: new Error(i18n.get('pages.legal.unknownKey', { name: originalType }))
      })
    }

    Meteor.call(Legal.methods.get.name, { name: originalType }, (err, res) => {
      if (err) return instance.state.set({ error: err })

      const markedOptions = {
        mangle: false,
        breaks: true,
        gfm: true
      }

      marked.parse(res, markedOptions, (parsingError, content) => {
        if (parsingError) {
          return instance.state.set({ error: parsingError })
        }

        instance.state.set({ content })
      })
      instance.state.set({ type: originalType })
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
    return `pages.legal.${type}`
  }
})

Template.legal.events({
  'click .back-button' (/* event, templateInstance */) {
    window.history.back()
  }
})
