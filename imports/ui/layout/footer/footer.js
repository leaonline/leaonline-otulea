import { Template } from 'meteor/templating'
import { Legal } from '../../../contexts/legal/Legal'
import { Logos } from '../../../contexts/logos/Logos'
import './footer.scss'
import './footer.html'

const legalRoutes = Object.keys(Legal.schema).map(key => {
  const value = Legal.schema[key]
  return {
    name: key,
    label: value.label
  }
})

Template.footer.onCreated(function () {
  const instance = this

  instance.initDependencies({
    tts: true,
    language: true,
    onComplete () {
      instance.state.set('dependenciesComplete', true)
    }
  })
})

Template.footer.onRendered(function () {
  const instance = this

  // defer logo loading until first rendering occurred
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
    return legalRoutes
  }
})
