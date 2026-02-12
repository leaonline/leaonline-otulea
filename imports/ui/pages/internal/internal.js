import { Unit } from '../../../contexts/Unit'
import { Template } from 'meteor/templating'
import { loadContentDoc } from '../../loading/loadContentDoc'
import { initTaskRenderers } from '../../renderers/initTaskRenderers'
import { createItemInput } from '../unit/item/createItemInput'
import { createItemLoad } from '../unit/item/createItemLoad'
import { ResponseCache } from '../unit/cache/ResponseCache'
import './Internal.html'
import '../login/login'
import { UnitSet } from '../../../contexts/unitSet/UnitSet'
import { dataTarget } from '../../../utils/dataTarget'

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
    translations: {
      // de: () => import('./i18n/de')
    },
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
  }
})

Template.internal.events({
  'click #unitSearchButton': async function (event, instance) {
    event.preventDefault()

    const type = instance.$('#typeSelect').val().trim()
    const code = instance.$('#unitInput').val().trim()
    const isShortCode = shortCodeRegex.test(code)

    switch (type) {
      case 'unitSet':
        await loadUnitSet({ code, isShortCode, instance })
        break
      case 'unit':
        await loadUnit({ code, isShortCode, instance })
        break
      default:
        console.warn('Unknown type', type)
    }
  },
  'click .unit-btn' (event, instance) {
    event.preventDefault()
    instance.state.set('unitDoc', null)
    const index = dataTarget(event, 'index')
    console.debug(index)
    const units = instance.state.get('unitDocs')
    const unitDoc = units[index]
    console.debug('unitDoc', unitDoc.shortCode)
    setTimeout(() => instance.state.set({ unitDoc }), 300)
  }
})

async function loadUnitSet ({ code, isShortCode, instance }) {
  console.debug('fetch unitSet', code, isShortCode)
  const unitSetDoc = await loadContentDoc(UnitSet, code, console.debug, { isShortCode })
  const unitDocs = []
  console.debug('fetch units for unitSet', unitSetDoc._id, unitSetDoc.units.length)
  for (const unitId of unitSetDoc.units) {
    const unitDoc = await loadContentDoc(Unit, unitId, console.debug, { isShortCode })
    unitDocs.push(unitDoc)
  }
  instance.state.set({ unitSetDoc, unitDocs })
}
async function loadUnit ({ code, isShortCode, instance }) {
  console.debug('fetch unit', code, isShortCode)
  const unitDoc = await loadContentDoc(Unit, code, console.debug, { isShortCode })
  instance.state.set({ unitDoc, currentPageCount: 0 })
}

function onPageNavUpdate ({ action, newPage, templateInstance, onComplete }) {
  templateInstance.state.set(newPage)
  onComplete()
}
