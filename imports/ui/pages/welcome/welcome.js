import { Template } from 'meteor/templating'
import { Random } from 'meteor/random'
import '../../components/soundbutton/soundbutton'
import '../../components/actionButton/actionButton'
import '../../components/text/text'
import './welcome.css'
import './welcome.html'
import { TTSEngine } from '../../../api/tts/TTSEngine'

const MAX_INPUTS = 5

Template.welcome.onCreated(function () {
  const instance = this
  instance.newUser = new ReactiveVar(Random.id(MAX_INPUTS).toUpperCase())
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
    return Template.instance().newUser.get().split('').join(' ')
  },
  loginFail () {
    return Template.getState('loginFail')
  }
})

Template.welcome.events({
  'click .lea-welcome-yes' (event, templateInstance) {
    event.preventDefault()
    templateInstance.wizard.login(true)
    setTimeout(() => focusInput(templateInstance), 50)
  },
  'click .lea-welcome-no' (event, templateInstance) {
    event.preventDefault()
    templateInstance.wizard.newCode(true)
    setTimeout(() => focusInput(templateInstance), 50)
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
      TTSEngine.play({ text: event.key })
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
  },
  'click .lea-welcome-login' (event, templateInstance) {
    event.preventDefault()

    let loginCode = ''
    templateInstance.$('.login-field').each(function (index, input) {
      loginCode += templateInstance.$(input).val()
    })

    const newCode = templateInstance.state.get('newCode')
    if (newCode) {
      registerNewUser(loginCode.toUpperCase(), templateInstance)
    } else {
      loginUser(loginCode.toUpperCase(), templateInstance)
    }
  },
  'click .lea-back-button' (event, templateInstance) {
    event.preventDefault()

    templateInstance.wizard.newCode(false)
    templateInstance.wizard.login(false)
  }
})

function resetInputs(templateInstance) {
  templateInstance.$('.login-field').each(function (index, input) {
    templateInstance.$(input).val(null)
  })
}

function focusInput (templateInstance) {
  const $target = templateInstance.$(`input[data-index="0"]`)
  $target.focus()
  $target.get(0).scrollIntoView({behavior: 'smooth'})
}

function registerNewUser (code, templateInstance) {
  const registerCode = templateInstance.newUser.get()
  if (registerCode !== code) {
    templateInstance.state.set('loginFail', true)
    return
  } else {
    Meteor.call('registerUser', { code }, (err, userId) => {
      if (err) {
        console.error(err)
        resetInputs(templateInstance)
        focusInput(templateInstance)
        templateInstance.state.set('loginFail', true)
      } else {
        console.log('logged in', Meteor.user(), userId)
      }
    })
  }
}

function loginUser (code, templateInstance) {
  Meteor.loginWithPassword(code, code, (err) => {
    if (err) {
      console.error(err)
      resetInputs(templateInstance)
      focusInput(templateInstance)
      templateInstance.state.set('loginFail', true)
    } else {
      console.log('logged in', Meteor.user(), code)
    }
  })
}