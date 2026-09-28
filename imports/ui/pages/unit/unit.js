import { Template } from 'meteor/templating'
import { Blaze } from 'meteor/blaze'
import { ReactiveVar } from 'meteor/reactive-var'
import { Session } from '../../../contexts/session/Session'
import { Response } from '../../../contexts/response/Response'
import { UnitSet } from '../../../contexts/unitSet/UnitSet'
import { Dimension } from '../../../contexts/Dimension'
import { Level } from '../../../contexts/Level'
import { Unit } from '../../../contexts/Unit'
import { ResponseCache } from './cache/ResponseCache'
import { UnitPageCache } from './cache/UnitPageCache'
import { initTaskRenderers } from '../../renderers/initTaskRenderers'
import { isCurrentUnit } from '../../../contexts/session/utils/isCurrentUnit'
import { createItemLoad } from './item/createItemLoad'
import { createItemInput } from './item/createItemInput'
import { createItemSubmit } from './item/createItemSubmit'
import { createSessionLoader } from '../../loading/createSessionLoader'
import { sessionIsComplete } from '../../../contexts/session/utils/sessionIsComplete'
import {
  finishUnit,
  resolveUnitSession,
  submitAndAdvancePage,
} from './unitBehavior'
import '../../components/container/container'
import '../../layout/navbar/navbar'
import './unit.html'

const responseCache = ResponseCache.create(window.localStorage)
const pageCache = UnitPageCache.create(window.localStorage)
const submitItems = createItemSubmit({
  loadValue: (responseDoc) => responseCache.load(responseDoc),
  prepare: (responseDoc) =>
    console.info('[Template.Unit]: submit to server', responseDoc),
  onSuccess: (result, responseDoc) => {
    const cleared = responseCache.clear(responseDoc)
    console.info('[Template.Unit]: clear storage', cleared, responseDoc)
  },
  onError: (error, responseDoc) => console.error(error, responseDoc),
})

Template.unit.onCreated(function () {
  const instance = this
  instance.renderersLoaded = initTaskRenderers()
  instance.state.setDefault('currentPageCount', -1)
  instance.state.setDefault('maxPages', -1)
  instance.dependenciesLoaded = new ReactiveVar(false)

  const { api } = instance.initDependencies({
    language: true,
    tts: true,
    contexts: [Session, Unit, UnitSet, Response, Dimension, Level],
    translations: {
      de: () => import('./i18n/de'),
    },
    onComplete() {
      instance.onItemInput = createItemInput({
        cache: responseCache,
        debug: instance.api.debug,
      })
      instance.onItemLoad = createItemLoad({
        cache: responseCache,
        debug: instance.api.debug,
      })
      instance.onNewPage = ({ action, newPage }, onComplete) => {
        onPageNavUpdate({
          action,
          newPage,
          templateInstance: instance,
          onComplete,
        })
      }
      instance.dependenciesLoaded.set(true)
    },
  })

  const { info } = api
  const sessionLoader = createSessionLoader({ info })

  instance.autorun(() => {
    const { params } = Template.currentData()
    const { unitId, sessionId } = params

    // simply skip if these params are not set, and let the router take care
    if (!unitId || !sessionId) {
      info('no unitId/sessionId', { unitId, sessionId })
      return abortUnit(instance)
    }

    const currentPageCount = pageCache.load(params) || 0

    instance.state.clear()
    sessionLoader({ sessionId, unitId })
      .then((responseData) => {
        const decision = resolveUnitSession({
          sessionId,
          unitId,
          responseData,
          currentPageCount,
          isComplete: sessionIsComplete,
          isCurrentUnit,
        })
        if (decision.action === 'finish') {
          return instance.data.finish(decision.args)
        }
        if (decision.action === 'next') {
          return instance.data.next(decision.args)
        }
        if (decision.action === 'exit') {
          info(
            responseData
              ? 'response data is incomplete'
              : 'response data undefined',
          )
          return abortUnit(instance)
        }
        instance.state.set(decision.state)
      })
      .catch((err) => {
        info('session loader failed')
        abortUnit(instance, err)
      })
  })
})

Template.unit.onDestroyed(function () {
  this.state.set({
    fadedOut: null,
  })
})

Template.unit.helpers({
  loadComplete() {
    const instance = Template.instance()
    return (
      instance.dependenciesLoaded.get() &&
      instance.state.get('unitDoc') &&
      instance.state.get('sessionDoc') &&
      instance.renderersLoaded.get()
    )
  },
  navLoadComplete() {
    const instance = Template.instance()
    return (
      instance.state.get('sessionDoc') &&
      instance.state.get('dimensionDoc') &&
      instance.state.get('levelDoc')
    )
  },
  pageContentData() {
    if (!Template.instance().renderersLoaded.get()) return

    const instance = Template.instance()
    const sessionDoc = instance.state.get('sessionDoc')
    const unitDoc = instance.state.get('unitDoc')
    const color = instance.state.get('color')
    const currentPageCount = instance.state.get('currentPageCount')
    const depsComplete = instance.dependenciesLoaded.get()

    let onInput = () => {}
    let onLoad = () => {}
    let onNewPage = () => {}

    if (depsComplete && instance.state.get('sessionDoc')) {
      onInput = instance.onItemInput
      onLoad = instance.onItemLoad
      onNewPage = instance.onNewPage
    }

    return {
      isPreview: false,
      currentPageCount,
      sessionId: sessionDoc._id,
      doc: unitDoc,
      color,
      onInput,
      onLoad,
      onNewPage,
      onLoadError: (err) => console.error(err),
      onLoadComplete: () => console.warn('item renderer load complete'),
    }
  },
  navbarData() {
    const instance = Template.instance()
    const sessionDoc = instance.state.get('sessionDoc')
    const levelDoc = instance.state.get('levelDoc')
    const unitDoc = instance.state.get('unitDoc')
    const unitSetDoc = instance.state.get('unitSetDoc')
    const dimensionDoc = instance.state.get('dimensionDoc')

    return {
      sessionDoc,
      levelDoc,
      unitSetDoc,
      dimensionDoc,
      unitDoc,
      showProgress: true,
      onExit: instance.data.exit,
    }
  },
})

Template.unit.events({
  'click .lea-unit-finishstory-button'(event, templateInstance) {
    event.preventDefault()
    templateInstance.api.fadeOut('.lea-unit-story-container', () => {
      templateInstance.state.set('unitStory', null)
    })
  },
  'click .lea-pagenav-finish-button': async (event, templateInstance) => {
    event.preventDefault()
    await finishUnitFromTemplate({ templateInstance })
  },
})

export async function onPageNavUpdate({
  newPage,
  templateInstance,
  onComplete,
  submit = submitItems,
  savePage = (key, page) => pageCache.save(key, page),
  delay = () => new Promise((resolve) => setTimeout(resolve, 500)),
  releaseWaiting = releasePageRendererWaiting,
  onError = (error) => console.error(error),
}) {
  const unitDoc = templateInstance.state.get('unitDoc')
  const sessionDoc = templateInstance.state.get('sessionDoc')
  const sessionId = sessionDoc._id
  const currentPageCount = templateInstance.state.get('currentPageCount')

  try {
    const pageState = await submitAndAdvancePage({
      sessionId,
      unitDoc,
      sessionDoc,
      currentPageCount,
      newPage,
      submitItems: submit,
      savePage,
      delay,
    })
    templateInstance.state.set(pageState)
    onComplete()
    return pageState
  } catch (error) {
    onError(error)
    releaseWaiting(templateInstance)
    return undefined
  }
}

export function releasePageRendererWaiting(templateInstance) {
  const node = templateInstance
    .$?.('.lea-unit-current-content-container')
    ?.get?.(0)
  let view = node && Blaze.getView(node)

  while (view) {
    if (view.name === 'Template.taskPageRenderer') {
      const renderer = view.templateInstance?.()
      renderer?.state?.set('waitForSubmit', false)
      return !!renderer
    }
    view = view.parentView
  }
  return false
}

export async function finishUnitFromTemplate({
  templateInstance,
  submit = submitItems,
  flushResponses = () => responseCache.flush(),
  callNext = ({ sessionId }) =>
    templateInstance.api.callMethod({
      name: Session.methods.next.name,
      args: { sessionId },
    }),
  clearPage = (key) => pageCache.clear(key),
  finish = finishUnit,
  abort = abortUnit,
  onError = (error) => console.error(error),
}) {
  // prevent multiple calls by fast-multiple-clicking
  if (templateInstance.state.get('finishing')) return undefined
  templateInstance.state.set('finishing', true)

  const sessionDoc = templateInstance.state.get('sessionDoc')
  const sessionId = sessionDoc._id
  const unitDoc = templateInstance.state.get('unitDoc')
  const page = templateInstance.state.get('currentPageCount')

  let transition
  try {
    transition = await finish({
      sessionId,
      unitDoc,
      page,
      submitItems: submit,
      flushResponses,
      callNext,
      clearPage,
    })
  } catch (error) {
    templateInstance.state.set('finishing', false)
    if (error.unitTransitionStage === 'session') {
      templateInstance.api.info('session update failed')
      abort(templateInstance, error)
      return undefined
    }
    templateInstance.api.info('item submission failed')
    onError(error)
    return undefined
  }

  templateInstance.api.debug('session updated', transition.sessionUpdate)
  templateInstance.api.fadeOut(transition.fadeTarget, () => {
    templateInstance.state.set('unitDoc', null)
    templateInstance.state.set('fadedOut', true)
    templateInstance.data.next(transition.navigation)
  })
  return transition
}

function abortUnit(templateInstance, err) {
  if (err) {
    console.error('Unit aborted')
    console.error(err) // todo sendError
  }

  templateInstance.api.fadeOut('.lea-unit-container', () => {
    // there should be a strategy pattern here so we can easily switch depending
    // on the settings configuration and users needs (tests vs production etc.)
    templateInstance.data.exit()
  })
}
