import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { ReactiveVar } from 'meteor/reactive-var'
import { ReactiveDict } from 'meteor/reactive-dict'
import { Random } from 'meteor/random'
import { Users } from '../../../contexts/user/User'
import { loggedIn } from '../../../utils/accountUtils'
import { fadeOut } from '../../../utils/animationUtils'
import '../../components/container/container'
import './welcome.scss'
import './welcome.html'

const settings = Meteor.settings.public.accounts
const MAX_INPUTS = settings.code.length
const inputFieldIndices = [...new Array(MAX_INPUTS)].map((v, i) => i)
const whiteSpace = /\s+/g
let originalVideoHeight

Template.welcome.onCreated(function () {
  const instance = this
  instance.state = new ReactiveDict()
  instance.state.set('loginCode', null)
  instance.state.set('loadComplete', false)
  instance.state.set('isDemoUser', !!instance.data?.queryParams?.demo)
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

  instance.state.set('loadComplete', true)
  instance.wizard.intro(true)

  instance.initDependencies({
    language: true,
    tts: true,
    onComplete: () => {
      instance.state.set('dependenciesComplete', true)
    },
    onError: e => {
      // instance.data.onFail()
      console.error(e)
      instance.state.set('dependenciesComplete', true)
    }
  })
})

Template.welcome.helpers({
  loadComplete () {
    return Template.instance().state.get('loadComplete')
  },
  dependenciesComplete () {
    return Template.instance().state.get('dependenciesComplete')
  },
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
    const newUser = Template.instance().newUser.get()
    if (!newUser) return
    const split = newUser.split('')
    const text = split.join(' ')
    const tts = split.join(', ')
    return { text, tts }
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
  },
  loggedIn () {
    if (!loggedIn()) return false
    return !Template.getState('logginIn')
  },
  loggingIn () {
    return Template.getState('logginIn')
  },
  loginTTS () {
    const loginCode = Template.getState('loginCode')
    if (!loginCode || !loginCode.length) return ''
    return loginCode.split('').join(', ')
  },
  inputFieldIndices () {
    return inputFieldIndices.slice(1, inputFieldIndices.length)
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

    // if we have a video container we can shrink it's size using a nice effect
    // $videoContainer.animate({ height: '200px' }, 500, 'swing', () => {})
    // const $videoContainer = templateInstance.$('.intro-video-container')
    templateInstance.wizard.login(true)
    setTimeout(() => focusInput(templateInstance), 50)
  },
  'click .lea-welcome-no' (event, templateInstance) {
    event.preventDefault()
    // if we have a video container we can shrink it's size using a nice effect
    // const $videoContainer = templateInstance.$('.intro-video-container')
    // $videoContainer.animate({ height: '200px' }, 500, 'swing', () => {})
    templateInstance.wizard.newCode(true)
    setTimeout(() => focusInput(templateInstance), 50)
  },
  'paste .login-field' (event, templateInstance) {
    // Stop data actually being pasted
    event.stopPropagation()
    event.preventDefault()

    // Get pasted data via clipboard API
    const target = event.originalEvent || event
    const clipboardData = target.clipboardData || window.clipboardData

    if (!clipboardData) {
      console.error('No ClipboardData available!')
      // TODO send to server to log this error along with the detected browser
    }

    const pastedData = clipboardData.getData('Text').replace(whiteSpace, '')

    // we accept only the correct length of usernames
    if (pastedData.length !== MAX_INPUTS) {
      console.debug('[Template.welcome]: rejected', pastedData)
      return false
    }

    inputFieldIndices.forEach(index => {
      const value = pastedData.charAt(index)
      templateInstance.$(`input[data-index="${index}"]`).val(value)
    })

    templateInstance.state.set('loginCode', pastedData)
    showLoginButton(templateInstance)
  },
  'keydown .login-field' (event, templateInstance) {
    // if there is a paste operation we skip the key-down and bubble to paste
    if (event.key === 'v' && (event.ctrlKey || event.metaKey)) {
      return true
    }

    // skip everything on Tab to keep
    // accessibility in standard mode
    if (event.code === 'Tab') {
      return true
    }

    event.preventDefault()
    const $target = templateInstance.$(event.currentTarget)
    const indexStr = $target.data('index')
    const index = parseInt(indexStr, 10)

    if (event.code === 'Backspace') {
      if (index === 0) {
        return true
      }
      else {
        // update field and position
        const $prev = templateInstance.$(`input[data-index="${index - 1}"]`)
        $target.val('')
        $prev.val('')
        $prev.focus()
        // update logincode
        const loginCode = getLoginCode(templateInstance)
        templateInstance.state.set('loginCode', loginCode)
      }
    }
    else if (event.code.indexOf('Key') > -1 || event.code.indexOf('Digit') > -1) {
      // update values
      $target.val(event.key)
      const loginCode = getLoginCode(templateInstance)
      templateInstance.state.set('loginCode', loginCode)

      // update pointer
      if (index < MAX_INPUTS - 1) {
        const $next = templateInstance.$(`input[data-index="${index + 1}"]`)
        $next.focus()
      }
      else {
        showLoginButton(templateInstance)
      }
    }
  },
  'keydown .lea-welcome-login' (event, templateInstance) {
    if (event.code === 'Backspace') {
      // update field and position
      const $prev = templateInstance.$(`input[data-index="${MAX_INPUTS - 1}"]`)
      $prev.val('')
      $prev.focus()
      // update logincode
      const loginCode = getLoginCode(templateInstance)
      templateInstance.state.set('loginCode', loginCode)
    }
  },
  'click .lea-welcome-login' (event, templateInstance) {
    event.preventDefault()

    templateInstance.state.set('logginIn', true)

    const loginCode = getLoginCode(templateInstance)

    const newCode = templateInstance.state.get('newCode')
    if (newCode) {
      registerNewUser(loginCode.toUpperCase(), templateInstance)
    }
    else {
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
    fadeOut('.lea-welcome-container', templateInstance, () => {
      templateInstance.data.next()
    })
  }
})

function getLoginCode (templateInstance) {
  let loginCode = ''
  templateInstance.$('.login-field').each(function (index, input) {
    loginCode += templateInstance.$(input).val()
  })
  return loginCode
}

function resetInputs (templateInstance) {
  templateInstance.$('.login-field').each(function (index, input) {
    templateInstance.$(input).val(null)
  })
  // update logincode
  const loginCode = getLoginCode(templateInstance)
  templateInstance.state.set('loginCode', loginCode)
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

function loginFail (templateInstance, error) {
  resetInputs(templateInstance)
  focusInput(templateInstance)
  templateInstance.state.set('logginIn', false)
  templateInstance.state.set('loginFail', true)

  // tracking: record failed login attempt to better know how
  // good users handle password based login
  if (error) {
    console.error(error)
    // templateInstance.api.sendError({ error })
  }
}

function registerNewUser (code, templateInstance) {
  const registerCode = templateInstance.newUser.get()
  const isDemoUser = templateInstance.state.get('isDemoUser')

  if (registerCode !== code) {
    return loginFail(templateInstance)
  }
  else {
    Users.methods.register.call({ code, isDemoUser }, (err) => {
      if (err) {
        loginFail(templateInstance, err)
      }
      else {
        loginUser(code, templateInstance)
      }
    })
  }
}

function loginUser (code, templateInstance) {
  Meteor.loginWithPassword(code, code, (err) => {
    if (err) {
      loginFail(templateInstance, err)
    }
    else {
      onLoggedIn()
      fadeOut('.lea-welcome-container', templateInstance, () => {
        templateInstance.data.next()
      })
    }
  })
}

function onLoggedIn () {
  const screenWidth = window.screen.width * window.devicePixelRatio
  const screenHeight = window.screen.height * window.devicePixelRatio
  const viewPortWidth = window.screen.availWidth
  const viewPortHeight = window.screen.availHeight
  Users.methods.loggedIn.call({
    screenWidth,
    screenHeight,
    viewPortWidth,
    viewPortHeight
  }, (err) => {
    if (err) console.log(err)
  })
}
