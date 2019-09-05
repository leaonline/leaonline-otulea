import { Template } from 'meteor/templating'
import { Random } from 'meteor/random'
import '../../components/soundbutton/soundbutton'
import '../../components/actionButton/actionButton'
import '../../components/text/text'
import './welcome.css'
import './welcome.html'

const MAX_INPUTS = 5

Template.welcome.onCreated(function () {
  const instance = this
  instance.wizard = {
    intro (value) {
      instance.state.set({ intro: value })
    },
    newCode (value) {
      instance.state.set({ newCode: value })
    },
    login (value) {
      instance.state.set({ login: value })
    }
  }
  instance.wizard.intro(true)
})

Template.welcome.helpers({
  intro () {
    return Template.instance().state.get('intro')
  },
  newCode () {
    return Template.instance().state.get('newCode')
  },
  login () {
    return Template.instance().state.get('login')
  },
  or (...args) {
    args.pop()
    console.log(args)
    const val = args.some(entry => !!entry)
    console.log(val)
    return val
  },
  randomCode () {
    return Random.id(MAX_INPUTS).toUpperCase()
  }
})

Template.welcome.events({
  'click .lea-welcome-yes' (event, templateInstance) {
    event.preventDefault()
    templateInstance.wizard.login(true)
  },
  'click .lea-welcome-no' (event, templateInstance) {
    event.preventDefault()
    templateInstance.wizard.newCode(true)
  },
  'keydown .login-field' (event, templateInstance) {
    event.preventDefault()
    const $target = templateInstance.$(event.currentTarget)
    const indexStr = $target.data('index')
    const index = parseInt(indexStr, 10)

    if (event.code === 'Backspace') {
      if (index === 0) {
        return true
      } else {
        const $prev = templateInstance.$(`input[data-index="${index - 1}"]`)
        $target.val('')
        $prev.val('')
        $prev.focus()
      }
    } else if (event.code.indexOf('Key') > -1 || event.code.indexOf('Digit') > -1) {
      $target.val(event.key)
      if (index < MAX_INPUTS - 1) {
        const $next = templateInstance.$(`input[data-index="${index + 1}"]`)
        $next.focus()
      } else {
        templateInstance.$('.lea-welcome-login').focus()
      }
    }
  },
  'keydown .lea-welcome-login' (event, templateInstance) {
    if (event.code === 'Backspace') {
      const $prev = templateInstance.$(`input[data-index="${MAX_INPUTS - 1}"]`)
      $prev.val('')
      $prev.focus()
    }
  }
})
