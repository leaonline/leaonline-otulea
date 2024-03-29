import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { ReactiveVar } from 'meteor/reactive-var'
import { Random } from 'meteor/random'
import { Users } from '../../../contexts/user/User'
import { loggedIn } from '../../../utils/accountUtils'
import { fadeOut } from '../../../utils/animationUtils'
import '../../components/container/container'
import './welcome.scss'
import './welcome.html'

const appStatus = Meteor.settings.public.status
const settings = Meteor.settings.public.accounts
const CODE_LENGTH = settings.code.length
const inputFieldIndices = [...new Array(CODE_LENGTH)].map((v, i) => i)
const whiteSpace = /\s+/g
let originalVideoHeight

Template.welcome.onCreated(function () {
  const instance = this

  instance.initDependencies({
    language: true,
    tts: true,
    translations: {
      de: () => import('./i18n/de')
    },
    onComplete: () => {
      instance.state.set('dependenciesComplete', true)
    },
    onError: e => {
      // instance.data.onFail()
      instance.state.set('dependenciesComplete', true)
    }
  })

  instance.newUser = new ReactiveVar()
  instance.state.set({
    loginCode: null,
    loadComplete: false,
    isDemoUser: !!instance.data?.queryParams?.demo,
    appStatus: appStatus,
    isBeta: appStatus === 'beta'
  })

  // see if we have a cached code and this may be a page refresh
  const existingCode = window.localStorage.getItem('newUserCode')
  if (existingCode) {
    instance.newUser.set(existingCode)
  }

  instance.wizard = {
    intro (value) {
      instance.state.set({ intro: value })
    },
    newCode (value) {
      // if we have no case yet we need to ask the server to create one
      if (!instance.newUser.get()) {
        instance.api.callMethod({
          name: Users.methods.generateCode,
          args: {},
          failure: err => {
            // as a fallback due to server error we try to generate a code from
            // client and hope it gets accepted on login
            console.error(err)
            const fallbackCode = Random.id(CODE_LENGTH).toUpperCase()
            window.localStorage.setItem('newUserCode', fallbackCode)
            instance.newUser.set(fallbackCode)
          },
          success: code => {
            window.localStorage.setItem('newUserCode', code)
            instance.newUser.set(code)
          }
        })
      }
      instance.state.set({ newCode: value })
    },
    login (value) {
      instance.state.set({ login: value })
    }
  }

  instance.state.set('loadComplete', true)
  instance.wizard.intro(true)
})

Template.welcome.helpers({
  loadComplete () {
    return Template.instance().state.get('loadComplete')
  },
  dependenciesComplete () {
    return Template.instance().state.get('dependenciesComplete')
  },
  isBeta () {
    return Template.instance().state.get('isBeta')
  },
  betaMessageOpen () {
    return Template.instance().state.get('betaMessageOpen')
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
    return !Template.getState('loggingIn')
  },
  loggingIn () {
    return Template.getState('loggingIn')
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

    templateInstance.wizard.newCode(true)

    // if we have a video container we can shrink it's size using a nice effect
    // const $videoContainer = templateInstance.$('.intro-video-container')
    // $videoContainer.animate({ height: '200px' }, 500, 'swing', () => {})
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
    if (pastedData.length !== CODE_LENGTH) {
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
  'input .login-field' (event, templateInstance) {
    const key = event.originalEvent.data
    const $current = templateInstance.$(event.currentTarget)
    console.debug('input', key)

    if (/^[a-zA-Z0-9]{1}$/i.test(key)) {
      const indexStr = $current.data('index')
      const index = parseInt(indexStr, 10)

      // update values
      $current.val(key)
      const loginCode = getLoginCode(templateInstance)
      templateInstance.state.set('loginCode', loginCode)

      // update pointer
      if (index < CODE_LENGTH - 1) {
        const $next = templateInstance.$(`input[data-index="${index + 1}"]`)
        $next.focus()
      }
      else {
        showLoginButton(templateInstance)
      }

      return true
    }

    else if (/\s+/.test(key)) {
      $current.val(null)
      $current.focus()
    }

    else {
      event.preventDefault()
      return false
    }
  },
  'keydown .login-field' (event, templateInstance) {
    const key = event.key.toLowerCase()

    if (key === 'enter' || key === 'return') {
      templateInstance.$('.lea-welcome-login').click()
      return true
    }

    // if there is a paste operation we skip the key-down and bubble to paste
    if (key === 'paste' || (key === 'v' && (event.ctrlKey || event.metaKey))) {
      return true
    }

    // skip everything on Tab to keep
    // accessibility in standard mode
    if (['escape', 'tab', 'shift', 'control', 'alt', ' ', 'spacebar', 'space bar'].includes(key) || /F\d{1,2}/i.test(key)) {
      return true
    }

    else if (/^[a-zA-Z0-9]{1}$/i.test(key)) {
      return true
    }

    event.preventDefault()
    const $current = templateInstance.$(event.currentTarget)
    const indexStr = $current.data('index')
    const index = parseInt(indexStr, 10)

    if (key === 'escape') {
      $current.blur()
      return true
    }

    // on any destructive operation we clear the current field
    // and jump to the previous input and re-eszablish edit mode
    if (['backspace', 'delete', 'clear', 'cut', 'undo'].includes(key)) {
      // if there is a value in this input we delete the current input
      if ($current.val()) {
        $current.val(null)
        $current.focus()
        const loginCode = getLoginCode(templateInstance)
        templateInstance.state.set('loginCode', loginCode)
      }

      else if (index > 0) {
        // if the current input contains no value we "jump" to the previous
        // input and delete it, then update field and position
        const $prev = templateInstance.$(`input[data-index="${index - 1}"]`)
        $current.val('')
        $prev.val('')
        $prev.focus()
        // update logincode
        const loginCode = getLoginCode(templateInstance)
        templateInstance.state.set('loginCode', loginCode)
      }

      else {
        return true
      }
    }

    else {
      return true
    }
  },
  'keydown .lea-welcome-login' (event, templateInstance) {
    const key = event.key.toLowerCase()

    if (['backspace', 'delete', 'clear', 'cut', 'undo'].includes(key)) {
      // update field and position
      const $prev = templateInstance.$(`input[data-index="${CODE_LENGTH - 1}"]`)
      $prev.val('')
      $prev.focus()
      // update logincode
      const loginCode = getLoginCode(templateInstance)
      templateInstance.state.set('loginCode', loginCode)
    }
  },
  'click .lea-welcome-login' (event, templateInstance) {
    event.preventDefault()

    templateInstance.state.set('loggingIn', true)

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
  },
  'click .toggle-beta' (event, templateInstance) {
    event.preventDefault()

    // prevent multiple clicks here
    if (templateInstance.state.get('betaToggling')) {
      return
    }

    templateInstance.state.get('betaToggling', true)

    const betaMessageOpen = templateInstance.state.get('betaMessageOpen')
    const betaToggleComplete = () => {
      templateInstance.state.set('betaMessageOpen', !betaMessageOpen)
      templateInstance.state.get('betaToggling', false)
    }

    if (betaMessageOpen) {
      templateInstance.api.fadeOut('.beta-content', betaToggleComplete)
    }
    else {
      templateInstance.api.fadeIn('.beta-content', betaToggleComplete)
    }
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
  templateInstance.state.set('loggingIn', false)
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

  // a failed attempt resets the state to enable a re-type of the login code
  if (registerCode !== code) {
    return loginFail(templateInstance)
  }

  // on a match we want to register the new user
  templateInstance.api.callMethod({
    name: Users.methods.register,
    args: { code, isDemoUser },
    prepare: () => templateInstance.state.set('loggingIn', true),
    failure: err => loginFail(templateInstance, err),
    success: () => loginUser(code, templateInstance)
  })
}

function loginUser (code, templateInstance) {
  Meteor.loginWithPassword(code, code, (err) => {
    if (err) {
      return loginFail(templateInstance, err)
    }

    window.localStorage.removeItem('newUserCode')
    onLoggedIn(templateInstance)
    fadeOut('.lea-welcome-container', templateInstance, () => {
      templateInstance.data.next()
    })
  })
}

function onLoggedIn (templateInstance) {
  templateInstance.state.set('loggingIn', false)
  templateInstance.state.set('loginFail', false)

  const screenWidth = window.screen.width * window.devicePixelRatio
  const screenHeight = window.screen.height * window.devicePixelRatio
  const viewPortWidth = window.screen.availWidth
  const viewPortHeight = window.screen.availHeight

  templateInstance.api.callMethod({
    name: Users.methods.loggedIn,
    args: {
      screenWidth,
      screenHeight,
      viewPortWidth,
      viewPortHeight
    },
    failure: err => console.error(err)
  })
}
