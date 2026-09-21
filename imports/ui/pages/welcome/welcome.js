import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { ReactiveVar } from 'meteor/reactive-var'
import { Random } from 'meteor/random'
import { Users } from '../../../contexts/user/User'
import { loggedIn } from '../../../utils/accountUtils'
import { fadeOut } from '../../../utils/animationUtils'
import {
  combineLoginCode,
  createWelcomeAuth,
  deleteLoginInput,
  normalizePastedCode,
  updateLoginInput,
} from './welcomeBehavior'
import '../../components/container/container'
import './welcome.scss'
import './welcome.html'

const appStatus = Meteor.settings.public.status
const settings = Meteor.settings.public.accounts
const CODE_LENGTH = settings.code.length
const inputFieldIndices = [...new Array(CODE_LENGTH)].map((v, i) => i)
let originalVideoHeight

Template.welcome.onCreated(function () {
  const instance = this

  instance.initDependencies({
    language: true,
    tts: true,
    translations: {
      de: () => import('./i18n/de'),
    },
    onComplete: () => {
      instance.state.set('dependenciesComplete', true)
    },
    onError: (e) => {
      // instance.data.onFail()
      instance.state.set('dependenciesComplete', true)
    },
  })

  instance.newUser = new ReactiveVar()
  instance.state.set({
    loginCode: null,
    loadComplete: false,
    isDemoUser: !!instance.data?.queryParams?.demo,
    appStatus: appStatus,
    isBeta: appStatus === 'beta',
  })

  // see if we have a cached code and this may be a page refresh
  const existingCode = window.localStorage.getItem('newUserCode')
  if (existingCode) {
    instance.newUser.set(existingCode)
  }

  instance.wizard = {
    intro(value) {
      instance.state.set({ intro: value })
    },
    newCode(value) {
      // if we have no case yet we need to ask the server to create one
      if (!instance.newUser.get()) {
        instance.api.callMethod({
          name: Users.methods.generateCode,
          args: {},
          failure: (err) => {
            // as a fallback due to server error we try to generate a code from
            // client and hope it gets accepted on login
            console.error(err)
            const fallbackCode = Random.id(CODE_LENGTH).toUpperCase()
            window.localStorage.setItem('newUserCode', fallbackCode)
            instance.newUser.set(fallbackCode)
          },
          success: (code) => {
            window.localStorage.setItem('newUserCode', code)
            instance.newUser.set(code)
          },
        })
      }
      instance.state.set({ newCode: value })
    },
    login(value) {
      instance.state.set({ login: value })
    },
  }

  instance.state.set('loadComplete', true)
  instance.wizard.intro(true)
})

Template.welcome.helpers({
  loadComplete() {
    return Template.instance().state.get('loadComplete')
  },
  dependenciesComplete() {
    return Template.instance().state.get('dependenciesComplete')
  },
  isBeta() {
    return Template.instance().state.get('isBeta')
  },
  betaMessageOpen() {
    return Template.instance().state.get('betaMessageOpen')
  },
  intro() {
    return Template.instance().state.get('intro')
  },
  newCode() {
    return Template.instance().state.get('newCode')
  },
  login() {
    return Template.instance().state.get('login')
  },
  or(...args) {
    args.pop()
    return args.some((entry) => !!entry)
  },
  randomCode() {
    const newUser = Template.instance().newUser.get()
    if (!newUser) return
    const split = newUser.split('')
    const text = split.join(' ')
    const tts = split.join(', ')
    return { text, tts }
  },
  loginFail() {
    return Template.getState('loginFail')
  },
  videoRequested() {
    return Template.getState('videoRequested')
  },
  loginRequired() {
    if (loggedIn()) {
      return false
    }
    const instance = Template.instance()
    return instance.state.get('login') || instance.state.get('newCode')
  },
  loggedIn() {
    if (!loggedIn()) return false
    return !Template.getState('loggingIn')
  },
  loggingIn() {
    return Template.getState('loggingIn')
  },
  loginTTS() {
    const loginCode = Template.getState('loginCode')
    if (!loginCode || !loginCode.length) return ''
    return loginCode.split('').join(', ')
  },
  inputFieldIndices() {
    return inputFieldIndices.slice(1, inputFieldIndices.length)
  },
})

Template.welcome.events({
  'click .lea-logout-button'(event, templateInstance) {
    event.preventDefault()
    Meteor.logout()
  },
  'click .request-video-button'(event, templateInstance) {
    event.preventDefault()
    templateInstance.state.set('videoRequested', true)
  },
  'click .lea-welcome-yes'(event, templateInstance) {
    event.preventDefault()

    // if we have a video container we can shrink it's size using a nice effect
    // $videoContainer.animate({ height: '200px' }, 500, 'swing', () => {})
    // const $videoContainer = templateInstance.$('.intro-video-container')
    templateInstance.wizard.login(true)
    setTimeout(() => focusInput(templateInstance), 50)
  },
  'click .lea-welcome-no'(event, templateInstance) {
    event.preventDefault()

    templateInstance.wizard.newCode(true)

    // if we have a video container we can shrink it's size using a nice effect
    // const $videoContainer = templateInstance.$('.intro-video-container')
    // $videoContainer.animate({ height: '200px' }, 500, 'swing', () => {})
    setTimeout(() => focusInput(templateInstance), 50)
  },
  'paste .login-field'(event, templateInstance) {
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

    const pastedData = normalizePastedCode(
      clipboardData.getData('Text'),
      CODE_LENGTH,
    )

    // we accept only the correct length of usernames
    if (!pastedData) {
      console.debug('[Template.welcome]: rejected', pastedData)
      return false
    }

    inputFieldIndices.forEach((index) => {
      const value = pastedData.charAt(index)
      templateInstance.$(`input[data-index="${index}"]`).val(value)
    })

    templateInstance.state.set('loginCode', pastedData)
    showLoginButton(templateInstance)
  },
  'input .login-field'(event, templateInstance) {
    const key = event.originalEvent.data
    const $current = templateInstance.$(event.currentTarget)
    console.debug('input', key)

    const index = parseInt($current.data('index'), 10)
    const transition = updateLoginInput({
      values: getLoginValues(templateInstance),
      index,
      key,
    })
    if (!transition.accepted) {
      event.preventDefault()
      return false
    }

    applyLoginValues(templateInstance, transition.values)
    templateInstance.state.set(
      'loginCode',
      combineLoginCode(transition.values),
    )
    if (transition.complete) {
      showLoginButton(templateInstance)
    } else {
      templateInstance
        .$(`input[data-index="${transition.focusIndex}"]`)
        .focus()
    }
    return true
  },
  'keydown .login-field'(event, templateInstance) {
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
    if (
      [
        'escape',
        'tab',
        'shift',
        'control',
        'alt',
        ' ',
        'spacebar',
        'space bar',
      ].includes(key) ||
      /F\d{1,2}/i.test(key)
    ) {
      return true
    } else if (/^[a-zA-Z0-9]{1}$/i.test(key)) {
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
      const transition = deleteLoginInput({
        values: getLoginValues(templateInstance),
        index,
      })
      applyLoginValues(templateInstance, transition.values)
      templateInstance
        .$(`input[data-index="${transition.focusIndex}"]`)
        .focus()
      templateInstance.state.set(
        'loginCode',
        combineLoginCode(transition.values),
      )
    } else {
      return true
    }
  },
  'keydown .lea-welcome-login'(event, templateInstance) {
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
  'click .lea-welcome-login'(event, templateInstance) {
    event.preventDefault()

    templateInstance.state.set('loggingIn', true)

    const loginCode = getLoginCode(templateInstance)
    const newCode = templateInstance.state.get('newCode')

    if (newCode) {
      registerNewUser(loginCode.toUpperCase(), templateInstance)
    } else {
      loginUser(loginCode.toUpperCase(), templateInstance)
    }
  },
  'click .lea-back-button'(event, templateInstance) {
    event.preventDefault()
    templateInstance.wizard.newCode(false)
    templateInstance.state.set('loginFail', false)
    templateInstance
      .$('.intro-video-container')
      .animate({ height: originalVideoHeight }, 500, 'swing', () => {
        templateInstance.wizard.login(false)
      })
  },
  'click .to-overview-button'(event, templateInstance) {
    fadeOut('.lea-welcome-container', templateInstance, () => {
      templateInstance.data.next()
    })
  },
  'click .toggle-beta'(event, templateInstance) {
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
    } else {
      templateInstance.api.fadeIn('.beta-content', betaToggleComplete)
    }
  },
})

function getLoginCode(templateInstance) {
  return combineLoginCode(getLoginValues(templateInstance))
}

function getLoginValues(templateInstance) {
  const values = []
  templateInstance.$('.login-field').each((index, input) => {
    values.push(templateInstance.$(input).val())
  })
  return values
}

function applyLoginValues(templateInstance, values) {
  values.forEach((value, index) => {
    templateInstance.$(`input[data-index="${index}"]`).val(value)
  })
}

function resetInputs(templateInstance) {
  templateInstance.$('.login-field').each((index, input) => {
    templateInstance.$(input).val(null)
  })
  // update logincode
  const loginCode = getLoginCode(templateInstance)
  templateInstance.state.set('loginCode', loginCode)
}

function focusInput(templateInstance) {
  const $target = templateInstance.$('input[data-index="0"]')
  $target.focus()
  $target.get(0).scrollIntoView(true)
}

function showLoginButton(templateInstance) {
  const $target = templateInstance.$('.lea-welcome-login-container')
  $target.removeClass('d-none')
  templateInstance.$('.lea-welcome-login').focus()
}

function loginFail(templateInstance, error) {
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

function registerNewUser(code, templateInstance) {
  const registerCode = templateInstance.newUser.get()
  const isDemoUser = templateInstance.state.get('isDemoUser')
  return createWelcomeAuthController(templateInstance).register({
    code,
    registerCode,
    isDemoUser,
  })
}

function loginUser(code, templateInstance) {
  return createWelcomeAuthController(templateInstance).login(code)
}

export function createWelcomeAuthController(
  templateInstance,
  {
    callMethod = (options) => templateInstance.api.callMethod(options),
    loginWithPassword = (code, password, callback) =>
      Meteor.loginWithPassword(code, password, callback),
    removeStoredCode = () => window.localStorage.removeItem('newUserCode'),
    notifyLoggedIn = () => onLoggedIn(templateInstance),
    transition = (onComplete) =>
      fadeOut('.lea-welcome-container', templateInstance, onComplete),
  } = {},
) {
  return createWelcomeAuth({
    callMethod: (options) => {
      const prepare = options.prepare
      return callMethod({
        ...options,
        prepare: () => {
          templateInstance.state.set('loggingIn', true)
          prepare()
        },
      })
    },
    loginWithPassword,
    registerMethod: Users.methods.register,
    onFailure: (error) => loginFail(templateInstance, error),
    onLoginSuccess: () => {
      removeStoredCode()
      notifyLoggedIn()
      transition(() => {
        templateInstance.data.next()
      })
    },
  })
}

function onLoggedIn(templateInstance) {
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
      viewPortHeight,
    },
    failure: (err) => console.error(err),
  })
}
