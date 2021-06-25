import { Blaze } from 'meteor/blaze'
import '../../ui/pages/loading/loading'
import '../../ui/components/complete/onComplete'

// if we use the autoload functionality we don't need to explicitly load basic
// and generic (stateless) templates, since they are loaded at runtime using
// dynamic imports.
let autoLoadEnabled = false

/**
 * This is a way to provide a Template-independent way of initializing
 * dependencies like i18n etc. that require a certain loading time.
 * @param language
 * @param tts
 * @param contexts
 * @param loaders
 * @param onComplete
 * @param onError
 * @return {Blaze.TemplateInstance}
 */

Blaze.TemplateInstance.prototype.initDependencies =
  function ({ language = false, tts = false, contexts = [], loaders = [], onComplete, onError }) {
    import { Components } from 'meteor/leaonline:ui/components/Components'

    if (!autoLoadEnabled) {
      Components.autoLoad()
      autoLoadEnabled = true
    }

    import { Router } from '../../ui/routing/Router'
    import { initLanguage } from '../../api/i18n/initLanguage'
    import { initializeTTS } from '../../api/tts/initializeTTS'
    import { initClientContext } from '../../api/context/initClientContext'
    import { loadOnce } from '../../ui/loading/loadOnce'
    import { createLog } from '../../utils/createInfoLog'
    import { loadAllContentDocs } from '../../ui/loading/loadAllContentDocs'
    import { loadContentDoc } from '../../ui/loading/loadContentDoc'
    import { fadeOut } from '../../utils/animationUtils'
    import { hasProperty } from '../../utils/object/hasProperty'
    import { isDebugUser } from '../../api/accounts/isDebugUser'
    import { sendError } from '../../contexts/errors/api/sendError'
    import { callMethod } from '../../infrastructure/methods/callMethod'

    const instance = this
    const allComplete = []

    // create api to provide a consistent dev experience across all template
    // instances without tight coupling between the api and Template files
    // TODO maybe dynamically import api using loadOnce, too?
    instance.api = {}
    instance.api.info = createLog({
      name: instance.view.name,
      devOnly: true,
      type: 'info'
    })

    const logDebug = createLog({
      name: instance.view.name,
      type: 'debug',
      devOnly: false
    })

    logDebug('initialize', { language, tts, contexts })

    Object.assign(instance.api, {
      queryParam: value => Router.queryParam(value),
      callMethod,
      loadAllContentDocs,
      loadContentDoc,
      hasProperty,
      isDebugUser,
      debug: (...args) => {
        if (isDebugUser()) {
          logDebug(...args)
        }
      },
      fadeOut: function (target, callback) {
        return fadeOut(target, instance, callback)
      },
      sendError: ({ error, isResponse }) => {
        sendError({
          error,
          isResponse,
          template: instance.view.name,
          failure: e => console.error(e)
        })
      }
    })

    // if any context is added we initialize it immediately sync-style
    contexts.forEach(ctx => initClientContext(ctx))

    if (language) {
      allComplete.push(loadOnce(initLanguage, { onError }))
    }

    if (tts) {
      allComplete.push(loadOnce(initializeTTS, { onError }))
    }

    if (loaders.length > 0) {
      allComplete.push(...(loaders.map(loader => loadOnce(loader, { onError }))))
    }

    if (allComplete.length === 0) {
      return onComplete()
    }

    instance.autorun(c => {
      if (allComplete.every(rv => rv.get())) {
        c.stop()
        instance.api.info('call dependencies onComplete')
        onComplete()
      }
    })

    return instance
  }
