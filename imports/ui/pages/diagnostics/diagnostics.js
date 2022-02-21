import { Template } from 'meteor/templating'
import { Diagnostics } from '../../../contexts/diagnostics/Diagnostics'
import { callMethod } from '../../../infrastructure/methods/callMethod'
import { normalizeError } from '../../../contexts/errors/api/normalizeError'
import { sendError } from '../../../contexts/errors/api/sendError'
import { initLanguage } from '../../../api/i18n/initLanguage'
import diagnosticsLanguage from './i18n/diagnosticsLanguage'
import '../../components/complete/onComplete'
import './diagnostics.html'

const consoleTypes = ['error', 'warn', 'info', 'log', 'debug']

Template.diagnostics.onCreated(function () {
  const instance = this
  instance.allData = []

  instance.debug = (...args) => console.debug('[diagnostics]:', ...args)
  const log = []
  const originals = {}
  let $logOut
  const logOutput = line => {
    if (!$logOut) {
      $logOut = document.querySelector('#diagnostics-log')
    }

    if (!$logOut) { return }
    $logOut.value = ($logOut.value) + line + '\n'
  }

  const overrideLog = (target) => {
    originals[target] = console[target]
    console[target] = (...args) => {
      const line = `[${target}]` + args.join(' ')
      log.push(line)
      logOutput(line)
      originals[target](...args)
    }
  }
  const restoreLog = target => {
    console[target] = originals[target]
  }

  consoleTypes.forEach(overrideLog)

  instance.addError = error => {
    console.error('[diagnostics]:', error.message)
    const normalized = normalizeError({ error })
    const errors = instance.state.get('errors') || []
    errors.push(normalized)

    instance.state.set({ errors })
  }

  instance.debug('init template')
  initLanguage()
    .catch(e => instance.addError(e))
    .then(() => {
      try {
        instance.initDependencies({
          tts: false,
          debug: true,
          translations: diagnosticsLanguage,
          onComplete () {
            instance.debug('init complete')
            instance.state.set('loadComplete', true)
          }
        })
      }
      catch (error) {
        instance.addError(error)
        instance.state.set({ loadComplete: true })
      }
    })

  const processResults = results => {
    instance.debug('process results')
    instance.allData = results

    instance.debug('map results')
    const map = new Map()
    results.forEach(entry => {
      const { name, label, ...rest } = entry
      map.set(entry.name, rest)
    })

    instance.debug('flatten entries')
    const entries = {}
    for (const entry of map.entries()) {
      entries[entry[0]] = entry[1]
    }

    instance.debug('create doc to send')
    const { osinfo, font, language, localStorage, serviceworker, performance, tts, screen, graphics } = entries
    const insertDoc = {
      bName: osinfo?.browser?.name,
      bVersion: osinfo?.browser?.version,
      bMajor: osinfo?.browser?.major,
      bEngine: osinfo?.engine?.name,
      bEngineV: osinfo?.engine?.version,

      ua: osinfo?.ua,

      // os
      osName: osinfo?.os?.name,
      osVersion: osinfo?.os?.version,
      osRelease: osinfo?.os?.release,
      osCodename: osinfo?.os?.codename,
      osInfoSuccess: osinfo?.success,

      // device
      isMobile: osinfo?.device?.isMobile,
      arch: osinfo?.cpu?.arch,
      vendor: osinfo?.device?.vendor,
      model: osinfo?.device?.model,
      ram: osinfo?.device?.ram,

      // features
      fontLoaded: font?.success,
      langLoaded: language?.success,
      localStorage: localStorage?.success,

      // tts
      ttsLoaded: tts?.success,
      ttsStatus: tts?.status,

      // sw
      swLoaded: serviceworker?.success,
      swStatus: serviceworker?.status,
      swActive: serviceworker?.active,
      swInstalling: serviceworker?.installing,
      swWaiting: serviceworker?.waiting,

      // performance
      perfLoaded: performance?.success,
      perfStart: performance?.startTime,
      perfDuration: performance?.duration,

      // screen
      availWidth: screen.availWidth,
      availHeight: screen.availHeight,
      width: screen.width,
      height: screen.height,
      colorDepth: screen.colorDepth,
      pixelDepth: screen.pixelDepth,
      orientation: screen.orientation?.type,

      // gl
      gl: graphics.gl,
      glRenderer: graphics.glRenderer,
      glVendor: graphics.glVendor,

      errors: []
    }

    for (const val of map.values()) {
      if (val?.error) {
        insertDoc.errors.push(val.error)
      }
    }

    instance.debug('processing complete')
    return insertDoc
  }

  instance.autorun(() => {
    const confirmed = instance.state.get('confirmed')
    if (!confirmed) return
    instance.debug('run diagnostics')

    Diagnostics.api.run({ debug: instance.debug })
      .then(result => {
        instance.debug('diagnostics collected')
        try {
          const insertDoc = processResults(result)
          instance.debug('send data to server')
          // restore console and cap log intercept to 500 lines
          consoleTypes.forEach(restoreLog)
          if (log.length > 500) log.length = 500

          insertDoc.log = log

          callMethod({
            name: Diagnostics.methods.send,
            args: insertDoc,
            prepare: () => instance.state.set('sending', true),
            receive: () => instance.state.set('sending', false),
            failure: er => {
              instance.addError(er)
              instance.state.set({
                sendError: normalizeError({
                  error: er || new Error('failed'),
                  template: 'diagnostics'
                }),
                sending: false
              })
            },
            success: () => instance.state.set('sendComplete', true)
          })
        }
        catch (error) {
          instance.addError(error)
        }
        finally {
          instance.state.set('diagnosticsComplete', true)
        }
      })
      .catch(error => {
        instance.addError(error)
        sendError({ error: error })
      })
      .finally(() => instance.state.set('diagnosticsComplete', true))
  })
})

Template.diagnostics.helpers({
  loadComplete () {
    return Template.getState('loadComplete')
  },
  results () {
    const instance = Template.instance()
    return instance.state.get('diagnosticsComplete') && instance.allData
  },
  confirmed () {
    return Template.getState('confirmed')
  },
  sending () {
    return Template.getState('sending')
  },
  sendComplete () {
    return Template.getState('sendComplete')
  },
  sendError () {
    return Template.getState('sendError')
  },
  errors () {
    return Template.getState('errors')
  },
  running () {
    return Template.getState('confirmed') && !Template.getState('diagnosticsComplete')
  }
})

Template.diagnostics.events({
  'click .confirm-button' (event, templateInstance) {
    event.preventDefault()
    templateInstance.state.set('confirmed', true)
  }
})
