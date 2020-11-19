import { Blaze } from 'meteor/blaze'
import { Components } from 'meteor/leaonline:ui/components/Components'
import { initLanguage } from './language'
import { initializeTTS } from './leaconfig'
import { initClientContext } from './context'
import { loadOnce } from '../../api/loading/loadOnce'
import { createLog } from '../../utils/createInfoLog'
import { loadAllContentDocs } from '../../api/loading/loadAllContentDocs'
import { Router } from '../../api/routing/Router'
import { fadeOut } from '../../utils/animationUtils'
import { callMethod } from '../../infrastructure/methods/callMethod'
import { loadContentDoc } from '../../api/loading/loadContentDoc'

// if we use the autoload functionality we don't need to explicitly load basic
// and generic (stateless) templates, since they are loaded at runtime using
// dynamic imports.
Components.autoLoad()

/**
 * This is a way to provide a Template-independent way of initializing
 * dependencies like i18n etc. that require a certain loading time.
 * @param language
 * @param tts
 * @param session
 * @param onComplete
 * @return {Blaze.TemplateInstance}
 */

Blaze.TemplateInstance.prototype.initDependencies =
  function ({ language = true, tts = true, contexts = [], loaders = [], onComplete }) {
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

    instance.api.queryParam = value => Router.queryParam(value)
    instance.api.callMethod = callMethod
    instance.api.loadAllContentDocs = loadAllContentDocs
    instance.api.loadContentDoc = loadContentDoc
    instance.api.fadeOut = function (target, callback) {
      return fadeOut(target, instance, callback)
    }

    // if any context is added we initialize it immediately sync-style
    contexts.forEach(ctx => initClientContext(ctx))

    if (language) {
      allComplete.push(loadOnce(initLanguage))
    }

    if (tts) {
      allComplete.push(loadOnce(initializeTTS))
    }

    if (loaders.length > 0) {
      allComplete.push(...(loaders.map(loader => loadOnce(loader))))
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
