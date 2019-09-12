import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { ReactiveVar } from 'meteor/reactive-var'
import { Random } from 'meteor/random'
import { Users } from '../../../api/accounts/User'
import { Router } from '../../../api/routing/Router'
import { TTSEngine } from '../../../api/tts/TTSEngine'
import { loggedIn } from '../../../utils/accountUtils'
import '../../components/soundbutton/soundbutton'
import '../../components/actionButton/actionButton'
import '../../components/textgroup/textgroup'
import '../../components/text/text'
import './welcome.scss'
import './welcome.html'

const MAX_INPUTS = 5
let originalVideoHeight

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
    return args.some(entry => !!entry)
  },
  randomCode () {
    return Template.instance().newUser.get().split('').join(' ')
  },
  loginFail () {
    return Template.getState('loginFail')
  },
  videoRequested () {
    return Template.getState('videoRequested')
  },
  loginRequired () {
    if (loggedIn()) {
      return false
    }
    const instance = Template.instance()
    return instance.state.get('login') || instance.state.get('newCode')
  }
})

Template.welcome.events({
  'click .lea-logout-button' (event, templateInstance) {
    event.preventDefault()
    Meteor.logout()
  },
  'click .request-video-button' (event, templateInstance) {
    event.preventDefault()
    templateInstance.state.set('videoRequested', true)
  },
  'click .lea-welcome-yes' (event, templateInstance) {
    event.preventDefault()
    const $videoContainer = templateInstance.$('.intro-video-container')
    originalVideoHeight = $videoContainer.height()
    $videoContainer.animate({ height: '100px' }, 500, 'swing', () => {
      templateInstance.wizard.login(true)
      setTimeout(() => focusInput(templateInstance), 50)
    })
  },
  'click .lea-welcome-no' (event, templateInstance) {
    event.preventDefault()
    const $videoContainer = templateInstance.$('.intro-video-container')
    originalVideoHeight = $videoContainer.height()
    $videoContainer.animate({ height: '100px' }, 500, 'swing', () => {
      templateInstance.wizard.newCode(true)
      setTimeout(() => focusInput(templateInstance), 50)
    })
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
        showLoginButton(templateInstance)
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
    templateInstance.state.set('loginFail', false)
    templateInstance.$('.intro-video-container').animate({ height: originalVideoHeight }, 500, 'swing', () => {
      templateInstance.wizard.login(false)
    })
  },
  'click .to-overview-button' (event, templateInstance) {
    const route = templateInstance.data.next()
    Router.go(route)
  }
})

function resetInputs (templateInstance) {
  templateInstance.$('.login-field').each(function (index, input) {
    templateInstance.$(input).val(null)
  })
}

function focusInput (templateInstance) {
  const $target = templateInstance.$('input[data-index="0"]')
  $target.focus()
  $target.get(0).scrollIntoView(true)
}

function showLoginButton (templateInstance) {
  const $target = templateInstance.$('.lea-welcome-login-container')
  $target.removeClass('d-none')
  templateInstance.$('.lea-welcome-login').focus()
}

function loginFail (templateInstance) {
  resetInputs(templateInstance)
  focusInput(templateInstance)
  templateInstance.state.set('loginFail', true)
}

function registerNewUser (code, templateInstance) {
  const registerCode = templateInstance.newUser.get()
  if (registerCode !== code) {
    return loginFail(templateInstance)
  } else {
    Users.methods.register.call({ code }, (err) => {
      if (err) {
        console.error(err)
        loginFail(templateInstance)
      } else {
        loginUser(code, templateInstance)
      }
    })
  }
}

function loginUser (code, templateInstance) {
  Meteor.loginWithPassword(code, code, (err) => {
    if (err) {
      console.error(err)
      loginFail(templateInstance)
    } else {
      onLoggedIn()
      const route = templateInstance.data.next()
      Router.go(route)
    }
  })
}

function onLoggedIn () {
  const screenWidth = window.screen.width * window.devicePixelRatio
  const screenHeight = window.screen.height * window.devicePixelRatio
  const viewPortWidth = window.screen.availWidth
  const viewPortHeight = window.screen.availHeight
  Users.methods.loggedIn.call({ screenWidth, screenHeight, viewPortWidth, viewPortHeight }, (err) => {
    if (err) console.log(err)
  })
}
