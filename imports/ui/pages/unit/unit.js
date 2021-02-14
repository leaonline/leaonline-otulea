/* global EventTarget Event */
import { Template } from 'meteor/templating'
import { ReactiveVar } from 'meteor/reactive-var'
import { Session } from '../../../contexts/session/Session'
import { Response } from '../../../contexts/Response'
import { UnitSet } from '../../../contexts/unitSet/UnitSet'
import { Dimension } from '../../../contexts/Dimension'
import { Level } from '../../../contexts/Level'
import { fadeOut, fadeIn } from '../../../utils/animationUtils'
import { dataTarget } from '../../../utils/eventUtils'
import { TaskRenderers } from '../../renderers/TaskRenderers'
import { Unit } from '../../../contexts/Unit'
import { ResponseCache } from './cache/ResponseCache'
import { UnitPageCache } from './cache/UnitPageCache'
import { callMethod } from '../../../infrastructure/methods/callMethod'
import { isCurrentUnit } from '../../../contexts/session/isCurrentUnit'
import { createItemLoad } from './item/createItemLoad'
import { createItemInput } from './item/createItemInput'
import { createItemSubmit } from './item/createItemSubmit'
import { createSessionLoader } from '../../../api/loading/createSessionLoader'
import '../../components/container/container'
import '../../layout/navbar/navbar'
import './unit.html'

const renderersLoaded = new ReactiveVar()
const responseCache = ResponseCache.create(window.localStorage)
const pageCache = UnitPageCache.create(window.localStorage)
const submitItems = createItemSubmit({ cache: responseCache })

Template.unit.onCreated(function () {
  const instance = this
  instance.collector = new EventTarget()
  instance.state.setDefault('currentPageCount', -1)
  instance.state.setDefault('maxPages', -1)
  instance.dependenciesLoaded = new ReactiveVar(false)

  const { api } = instance.initDependencies({
    language: true,
    tts: true,
    contexts: [Session, Unit, UnitSet, Response, Dimension, Level],
    onComplete () {
      instance.dependenciesLoaded.set(true)
    }
  })

  const { info } = api

  instance.autorun(computation => {
    if (renderersLoaded.get()) {
      info('renderers loaded')
      return computation.stop()
    }

    TaskRenderers.init()
      .then(() => renderersLoaded.set(true))
      .catch(e => console.error(e))
  })

  const sessionLoader = createSessionLoader({ info })

  instance.autorun(() => {
    const { params } = Template.currentData()
    const { unitId, sessionId } = params

    // simply skip if these params are not set, and let the router take care
    if (!unitId || !sessionId) {
      return abortUnit(instance)
    }

    const currentPageCount = pageCache.load(params) || 0

    instance.state.clear()
    sessionLoader({ sessionId, unitId })
      .catch(err => abortUnit(instance, err))
      .then(responseData => {
        info(responseData)

        const { sessionDoc, unitDoc, unitSetDoc, dimensionDoc, levelDoc, color } = responseData
        // first we check for all docs, even one left-out doc is not acceptable
        if (!sessionDoc || !unitDoc || !unitSetDoc || !dimensionDoc || !levelDoc) {
          return abortUnit(instance)
        }

        // verify received session doc integrity
        const { currentUnit } = sessionDoc

        // if we encounter a sessionDoc that is already completed, we just
        // skip any further attempts to load units and immediately finish
        if (Session.helpers.isComplete(sessionDoc)) {
          return instance.data.finish({ sessionId })
        }

        // if we encounter a unit, that is different from the sessionDoc's
        // current unit we skip directly to the "next" unit via currentUnit
        if (!isCurrentUnit({ sessionDoc, unitId: currentUnit })) {
          return instance.data.next({ unitId: currentUnit, sessionId })
        }

        // otherwise we're good and can continue with the current session
        instance.state.set({
          sessionDoc,
          unitSetDoc,
          dimensionDoc,
          levelDoc,
          color,
          unitDoc,
          currentPageCount,
          maxPages: unitDoc.pages.length,
          hasNext: unitDoc.pages.length > currentPageCount + 1
        })
      })
  })
})

Template.unit.onDestroyed(function () {
  const instance = this
  instance.state.set({
    fadedOut: null
  })
})

Template.unit.helpers({
  loadComplete () {
    const instance = Template.instance()
    return instance.dependenciesLoaded.get() &&
      instance.state.get('unitDoc') &&
      instance.state.get('sessionDoc') &&
      renderersLoaded.get()
  },
  navLoadComplete () {
    const instance = Template.instance()
    return instance.state.get('sessionDoc') &&
      instance.state.get('dimensionDoc') &&
      instance.state.get('levelDoc')
  },
  pageContentData () {
    if (!renderersLoaded.get()) return

    const instance = Template.instance()
    const sessionDoc = instance.state.get('sessionDoc')
    const unitDoc = instance.state.get('unitDoc')
    const color = instance.state.get('color')
    const currentPageCount = instance.state.get('currentPageCount')
    const depsComplete = instance.dependenciesLoaded.get()
    let onInput
    let onLoad

    if (depsComplete && instance.state.get('sessionDoc')) {
      onInput = createItemInput({ cache: responseCache })
      onLoad = createItemLoad({ cache: responseCache })
    }
    else {
      onInput = () => {}
      onLoad = () => {}
    }

    return {
      isPreview: false,
      currentPageCount: currentPageCount,
      sessionId: sessionDoc._id,
      doc: unitDoc,
      color: color,
      onInput: onInput,
      onLoad: onLoad
    }
  },
  navbarData () {
    const instance = Template.instance()
    const sessionDoc = instance.state.get('sessionDoc')
    const levelDoc = instance.state.get('levelDoc')
    const unitSetDoc = instance.state.get('unitSetDoc')
    const dimensionDoc = instance.state.get('dimensionDoc')

    return {
      sessionDoc,
      levelDoc,
      unitSetDoc,
      dimensionDoc,
      showProgress: true,
      onExit: instance.data.exit
    }
  }
})

Template.unit.events({
  'click .lea-pagenav-button' (event, templateInstance) {
    event.preventDefault()
    const action = dataTarget(event, templateInstance, 'action')
    const unitDoc = templateInstance.state.get('unitDoc')
    const sessionDoc = templateInstance.state.get('sessionDoc')
    const sessionId = sessionDoc._id
    const currentPageCount = templateInstance.state.get('currentPageCount')
    const newPage = {}

    if (action === 'next') {
      newPage.currentPageCount = currentPageCount + 1
      newPage.currentPage = unitDoc.pages[newPage.currentPageCount]
      newPage.hasNext = (newPage.currentPageCount + 1) < unitDoc.pages.length
    }

    if (action === 'back') {
      newPage.currentPageCount = currentPageCount - 1
      newPage.currentPage = unitDoc.pages[newPage.currentPageCount]
      newPage.hasNext = (newPage.currentPageCount + 1) < unitDoc.pages.length
    }

    if (!newPage.currentPage) {
      throw new Error(`Undefined page for current index ${newPage.currentPageCount}`)
    }

    templateInstance.collector.dispatchEvent(new Event('collect'))

    const $current = templateInstance.$('.lea-unit-current-content-container')
    const currentHeight = $current.height()
    const oldContainerCss = $current.css('height') || ''
    $current.css('height', `${currentHeight}px`)

    submitItems({ sessionId, unitDoc, page: currentPageCount })

    fadeOut('.lea-unit-current-content', templateInstance, () => {
      templateInstance.state.set(newPage)
      pageCache.save({
        sessionId,
        unitId: unitDoc._id
      }, newPage.currentPageCount)
      setTimeout(() => {
        fadeIn('.lea-unit-current-content', templateInstance, () => {
          $current.css('height', oldContainerCss)
        })
      }, 100)
    })
  },
  'click .lea-unit-finishstory-button' (event, templateInstance) {
    event.preventDefault()
    fadeOut('.lea-unit-story-container', templateInstance, () => {
      templateInstance.state.set('unitStory', null)
    })
  },
  'click .lea-pagenav-finish-button': async function (event, templateInstance) {
    event.preventDefault()
    const sessionDoc = templateInstance.state.get('sessionDoc')
    const sessionId = sessionDoc._id
    const unitDoc = templateInstance.state.get('unitDoc')
    const unitId = unitDoc._id
    const page = templateInstance.state.get('currentPageCount')

    await submitItems({ sessionId, unitDoc, page })
    const sessionUpdate = await callMethod({
      name: Session.methods.update.name,
      args: { sessionId }
    })

    const { nextUnit, completed } = sessionUpdate
    pageCache.clear({ sessionId, unitId })

    // we check if the route will be to another unit
    // se we would fade the navbar only when the
    // result page (or another pahe) will be shown
    const fadeTarget = completed
      ? '.lea-unit-container'
      : '.lea-unit-content-container'

    fadeOut(fadeTarget, templateInstance, () => {
      templateInstance.state.set('unitDoc', null)
      templateInstance.state.set('fadedOut', true)
      templateInstance.data.next({ sessionId, unitId: nextUnit, completed })
    })
  }
})

function abortUnit (instance, err) {
  if (err) {
    console.error('Unit aborted')
    console.error(err)
  }

  fadeOut('.lea-unit-container', instance, () => {
    // there should be a strategy pattern here so we can easily switch depending
    // on the settings configuration and users needs (tests vs production etc.)
    instance.data.exit()
  })
}
