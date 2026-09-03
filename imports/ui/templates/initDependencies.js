import { Blaze } from 'meteor/blaze'
import { Meteor } from 'meteor/meteor'
import { noop } from '../../utils/noop'
import { lazyRequire } from '../../utils/lazyRequire'

// if we use the autoload functionality we don't need to explicitly load basic
// and generic (stateless) templates, since they are loaded at runtime using
// dynamic imports.
let autoLoadEnabled = false

/**
 * This is a way to provide a Template-independent way of initializing
 * dependencies like i18n etc. that require a certain loading time.
 * @param translations
 * @param language
 * @param tts
 * @param contexts
 * @param loaders
 * @param onComplete
 * @param onError
 * @return {Blaze.TemplateInstance}
 */

Blaze.TemplateInstance.prototype.initDependencies = function ({
  translations,
  tts = false,
  language = tts || translations || false,
  contexts = [],
  loaders = [],
  onComplete,
  onError = (e) => console.error(e),
}) {
  const { Components } = require('meteor/leaonline:ui/components/Components')

  if (!autoLoadEnabled) {
    Components.autoLoad()
    Components.contentPath(Meteor.settings.public.hosts.content.base)
    autoLoadEnabled = true
  }

  const {
    Router,
    fatal,
    initLanguage,
    initializeTTS,
    initClientContext,
    loadOnce,
    createLog,
    loadAllContentDocs,
    loadContentDoc,
    fadeIn,
    fadeOut,
    hasProperty,
    isDebugUser,
    sendError,
    callMethod,
  } = loadLazyDeps()

  const instance = this
  const allComplete = []

  // create api to provide a consistent dev experience across all template
  // instances without tight coupling between the api and Template files
  // TODO maybe dynamically import api using loadOnce, too?
  instance.api = {}
  instance.api.info = createLog({
    name: instance.view.name,
    devOnly: !Meteor.user()?.debug,
    type: 'info',
  })

  const logDebug = createLog({
    name: instance.view.name,
    type: 'debug',
    devOnly: !Meteor.user()?.debug,
  })

  const errorHandler =
    onError ||
    createLog({
      name: instance.view.name,
      type: 'error',
      devOnly: false,
    })

  logDebug('initialize', { language, tts, contexts })

  const debugFn = Meteor.isDevelopment || Meteor.user()?.debug ? logDebug : noop

  Object.assign(instance.api, {
    queryParam: (value) => Router.queryParam(value),
    callMethod,
    loadAllContentDocs,
    loadContentDoc,
    hasProperty,
    isDebugUser,
    debug: debugFn,
    fadeOut: (target, callback) => fadeOut(target, instance, callback),
    fadeIn: (target, callback) => fadeIn(target, instance, callback),
    sendError: ({ error, isResponse }) => {
      sendError({
        error,
        isResponse,
        template: instance.view.name,
        failure: errorHandler,
      })
    },
  })

  // if any context is added we initialize it immediately sync-style
  contexts.forEach((ctx) => initClientContext(ctx))

  if (language) {
    allComplete.push(
      loadOnce(initLanguage, {
        onError: errorHandler,
        name: 'language',
      }),
    )
  }

  if (tts) {
    allComplete.push(
      loadOnce(initializeTTS, {
        onError: errorHandler,
        name: 'tts',
        debug: debugFn,
      }),
    )
  }

  if (loaders.length > 0) {
    allComplete.push(
      ...loaders.map((loader) =>
        loadOnce(loader, {
          onError: errorHandler,
        }),
      ),
    )
  }

  if (allComplete.length === 0) {
    return onComplete()
  }

  const addTranslations = async () => {
    const { addToLanguage } = await import('../../api/i18n/addToLanguage')
    return addToLanguage(translations)
  }

  instance.autorun((c) => {
    if (allComplete.every((rv) => rv.get())) {
      c.stop()
      instance.api.info('call dependencies onComplete')
      if (translations) {
        addTranslations()
          .catch((e) => {
            fatal({
              error: {
                message: 'unknown',
                original: e.message,
              },
            })

            sendError({ error: e })
            errorHandler(e)
          })
          .then(() => {
            onComplete()
          })
      } else {
        onComplete()
      }
    }
  })

  return instance
}

const loadLazyDeps = lazyRequire(() => {
  const { Router } = require('../routing/Router')
  const { fatal } = require('../components/fatal/fatal')
  const { initLanguage } = require('../../api/i18n/initLanguage')
  const { initializeTTS } = require('../../api/tts/initializeTTS')
  const { initClientContext } = require('../../api/context/initClientContext')
  const { loadOnce } = require('../loading/loadOnce')
  const { createLog } = require('../../utils/createInfoLog')
  const { loadAllContentDocs } = require('../loading/loadAllContentDocs')
  const { loadContentDoc } = require('../loading/loadContentDoc')
  const { fadeOut, fadeIn } = require('../../utils/animationUtils')
  const { hasProperty } = require('../../utils/object/hasProperty')
  const { isDebugUser } = require('../../api/accounts/isDebugUser')
  const { sendError } = require('../../contexts/errors/api/sendError')
  const { callMethod } = require('../../infrastructure/methods/callMethod')
  return {
    Router,
    fatal,
    initLanguage,
    initializeTTS,
    initClientContext,
    loadOnce,
    createLog,
    loadAllContentDocs,
    loadContentDoc,
    fadeIn,
    fadeOut,
    hasProperty,
    isDebugUser,
    sendError,
    callMethod,
  }
})
