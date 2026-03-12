import { Unit } from '../../../contexts/Unit'
import { Template } from 'meteor/templating'
import { UnitSet } from '../../../contexts/unitSet/UnitSet'
import { loadContentDoc } from '../../loading/loadContentDoc'
import { initTaskRenderers } from '../../renderers/initTaskRenderers'
import { createItemInput } from '../unit/item/createItemInput'
import { createItemLoad } from '../unit/item/createItemLoad'
import { dataTarget } from '../../../utils/dataTarget'
import { errorToObject } from '../../../utils/object/errorToObject'
import { ResponseCache } from '../unit/cache/ResponseCache'
import internalLang from './i18n/lang'
import './Internal.html'
import '../login/login'

const shortCodeRegex = /[a-zA-Z]{2}_\d\d\d\d_.*/
const renderersLoaded = initTaskRenderers()
const responseCache = ResponseCache.create({
  getItem () {},
  setItem () {},
  removeItem () {}
})

Template.internal.onCreated(function () {
  const instance = this
  instance.state.setDefault('currentPageCount', 0)
  instance.state.setDefault('maxPages', -1)
  instance.initDependencies({
    language: true,
    contexts: [Unit, UnitSet],
    tts: true,
    translations: internalLang,
    onComplete: () => {
      instance.onItemInput = createItemInput({
        cache: responseCache,
        debug: instance.api.debug
      })
      instance.onItemLoad = createItemLoad({
        cache: responseCache,
        debug: instance.api.debug
      })
      instance.onNewPage = ({ action, newPage }, onComplete) => {
        onPageNavUpdate({
          action,
          newPage,
          templateInstance: instance,
          onComplete
        })
      }
      instance.state.set('dependenciesComplete', true)
    },
    onError: e => {
      // instance.data.onFail()
      instance.state.set('dependenciesComplete', true)
    }
  })

  instance.onNewPage = () => {
    instance.state.set('currentPageCount', instance.state.get('currentPageCount') + 1)
  }
})

Template.internal.helpers({
  dependenciesComplete () {
    return Template.getState('dependenciesComplete') && renderersLoaded.get()
  },
  unitDoc () {
    return Template.getState('unitDoc')
  },
  currentUnit (doc) {
    return doc && Template.getState('unitDoc')?._id === doc._id
  },
  unitSetDoc () {
    return Template.getState('unitSetDoc')
  },
  unitDocs () {
    return Template.getState('unitDocs')
  },
  pageContentData () {
    if (!renderersLoaded.get()) return

    const instance = Template.instance()
    const unitDoc = instance.state.get('unitDoc')
    const currentPageCount = instance.state.get('currentPageCount')

    const onInput = () => {}
    const onLoad = () => {}
    const onNewPage = instance.onNewPage

    return {
      isPreview: true,
      currentPageCount: currentPageCount,
      sessionId: 'development',
      doc: unitDoc,
      color: 'primary',
      onInput: onInput,
      onLoad: onLoad,
      onNewPage: onNewPage,
      onLoadError: err => console.error(err),
      onLoadComplete: () => console.warn('item renderer load complete')
    }
  },
  error () {
    return Template.getState('error')
  }
})

Template.internal.events({
  'click #unitSearchButton': async function (event, instance) {
    event.preventDefault()
    debugger
    const type = instance.$('#typeSelect').val().trim()
    const field = instance.$('#fieldSelect').val().trim()
    const code = instance.$('#unitInput').val().trim()
    if (!code) return

    const isShortCode = field === 'code'
    switch (type) {
      case 'unitSet':
        await loadUnitSet({ code, isShortCode, instance })
        break
      case 'unit':
        await loadUnit({ code, isShortCode, instance })
        break
      default:
        instance.state.set({ error: { message: `Invalid type selected: ${type}` } })
    }
  },
  'click .unit-btn' (event, instance) {
    event.preventDefault()
    instance.state.set('unitDoc', null)
    const index = dataTarget(event, 'index')
    const units = instance.state.get('unitDocs')
    const unitDoc = units[index]
    setTimeout(() => instance.state.set({ unitDoc }), 300)
  }
})

async function loadUnitSet ({ code, isShortCode, instance }) {
  console.debug('fetch unitSet', code, isShortCode)
  try {
    const unitSetDoc = await loadContentDoc(UnitSet, code, console.debug, { isShortCode })
    const unitDocs = []
    console.debug('fetch units for unitSet', unitSetDoc._id, unitSetDoc.units.length)
    for (const unitId of unitSetDoc.units) {
      const unitDoc = await loadContentDoc(Unit, unitId, console.debug, { isShortCode: false })
      unitDocs.push(unitDoc)
    }
    instance.state.set({ unitSetDoc, unitDocs, error: null })
  }
  catch (e) {
    console.error('Error loading unitSet', e)
    instance.state.set({ unitSetDoc: null, unitDocs: [], error: errorToObject(e) })
  }
}
async function loadUnit ({ code, isShortCode, instance }) {
  console.debug('fetch unit', code, isShortCode)
  try {
    const unitDoc = await loadContentDoc(Unit, code, console.debug, { isShortCode })
    instance.state.set({ unitDoc, currentPageCount: 0, error: null })
  }
  catch (e) {
    console.error('Error loading unit', e)
    instance.state.set({ unitDoc: null, error: errorToObject(e) })
  }
}

function onPageNavUpdate ({ action, newPage, templateInstance, onComplete }) {
  templateInstance.state.set(newPage)
  onComplete()
}
