import { Template } from 'meteor/templating'
import { Diagnostics } from '../../../contexts/diagnostics/Diagnostics'
import { callMethod } from '../../../infrastructure/methods/callMethod'
import { normalizeError } from '../../../contexts/errors/api/normalizeError'
import { sendError } from '../../../contexts/errors/api/sendError'
import { initLanguage } from '../../../api/i18n/initLanguage'
import diagnosticsLanguage from './i18n/diagnosticsLanguage'
import '../../components/complete/onComplete'
import './diagnostics.html'

Template.diagnostics.onCreated(function () {
  const instance = this
  instance.allData = []

  instance.addError = error => {
    const normalized = normalizeError({ error })
    const errors = instance.state.get('errors') || []
    errors.push(normalized)

    instance.state.set({ errors })
  }

  initLanguage()
    .catch(e => instance.addError(e))
    .then(() => {
      try {
        instance.initDependencies({
          translations: diagnosticsLanguage,
          onComplete () {

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
    instance.state.set('diagnosticsComplete', true)
    instance.allData = results
    console.log('%c [diagnostics]: complete', 'background: #222; color: #bada55')

    const map = new Map()
    results.forEach(entry => {
      const { name, label, ...rest } = entry
      map.set(entry.name, rest)
    })

    const { osinfo, font, language, localStorage, serviceworker, performance, tts, screen, graphics } = Object.fromEntries(map.entries())
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

    for (const val in map.values()) {
      if (val?.error) {
        insertDoc.errors.push(val.error)
      }
    }

    callMethod({
      name: Diagnostics.methods.send,
      args: insertDoc,
      prepare: () => instance.state.set('sending', true),
      receive: () => instance.state.set('sending', false),
      failure: er => {
        instance.addError(er)
        instance.state.set('sendError', normalizeError({
          error: er || new Error('failed'),
          template: 'diagnostics'
        }))
      },
      success: () => instance.state.set('sendComplete', true)
    })
  }

  instance.autorun(() => {
    const confirmed = instance.state.get('confirmed')
    if (!confirmed) return

    Diagnostics.api.run()
      .then(result => {
        try {
          processResults(result)
        } catch (error) {
          instance.addError(error)
        }
      })
      .catch(error => {
        instance.addError(error)
        sendError({ error: error })
      })
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
  }
})

Template.diagnostics.events({
  'click .confirm-button' (event, templateInstance) {
    event.preventDefault()
    templateInstance.state.set('confirmed', true)
  }
})
