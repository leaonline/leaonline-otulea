import { EJSON } from 'meteor/ejson'
import { Unit } from '../../../contexts/Unit'
import { Template } from 'meteor/templating'
import { UnitSet } from '../../../contexts/unitSet/UnitSet'
import { loadContentDoc } from '../../loading/loadContentDoc'
import { initTaskRenderers } from '../../renderers/initTaskRenderers'
import { createItemInput } from '../unit/item/createItemInput'
import { createItemLoad } from '../unit/item/createItemLoad'
import { dataTarget } from '../../../utils/dataTarget'
import { errorToObject } from '../../../utils/object/errorToObject'
import { setQueryParam } from '../../routing/setQueryParam'
import { ResponseCache } from '../unit/cache/ResponseCache'
import { Scoring } from '../../../contexts/Scoring'
import internalLang from './i18n/lang'
import './Internal.html'
import '../login/login'

const renderersLoaded = initTaskRenderers()

Scoring.init()

Template.internal.onCreated(function () {
    const instance = this
    instance.state.setDefault('currentPageCount', 0)
    instance.state.setDefault('maxPages', -1)

    const storage = {
      data: {},
      getItem (key) {
        return this.data[key]
      },
      setItem (key, value) {
        this.data[key] = value
      },
      removeItem (key) {
        delete this.data[key]
      },
      getAll () {
        return { ...this.data }
      }
    }

    const options = {
      getKey: ({ sessionId, unitId, page, contentId }) => {
        const key = `${sessionId}-${unitId}-${page}-${contentId}`
        console.debug('generate cache key', key)
        return key
      },
      encode: value => value,
      decode: value => value
    }
    const responseCache = ResponseCache.create(storage, options)

    instance.initDependencies({
      language: true,
      contexts: [Unit, UnitSet],
      tts: true,
      debug: true,
      translations: internalLang,
      onComplete: () => {
        instance.onItemInput = createItemInput({
          cache: responseCache,
          debug: console.debug
        })
        instance.onItemLoad = createItemLoad({
          cache: responseCache,
          debug: console.debug,
          createIfMissing: true
        })
        instance.onNewPage = ({ action, newPage }, onComplete) => {
          Object.keys(storage.getAll()).forEach(key => storage.removeItem(key))
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

    instance.onEvaluate = () => {
      const currentPage = instance.state.get('currentPageCount')
      const allResponses = Object.entries(storage.data).filter(entry => {
        // filter out entries from other pages
        const [_sessionId, _unitId, page] = entry[0].split('-')
        return page == currentPage
      }).map(value => {
        const [sessionId, unitId, page, itemId] = value[0].split('-')
        const data = { sessionId, unitId, page, itemId, ...EJSON.parse(value[1]) }
        const itemDefinitions = Unit.getContentElement({
          unit: instance.state.get('unitDoc'),
          contentId: itemId,
          page: Number(page)
        })
        return Scoring.run(itemDefinitions.subtype, itemDefinitions.value, data)
      })

      return allResponses.flat()
    }

    // check query params for unit or unitSet
    const query = instance.data.queryParams ?? {}
    const { _id, shortCode, type } = query
    if (type === 'unitSet' && (shortCode || _id)) {
      loadUnitSet({ code: shortCode || _id, isShortCode: !!shortCode, instance }).catch(console.error)
    }
    else if (type === 'unit' && (shortCode || _id)) {
      loadUnit({ code: shortCode || _id, isShortCode: !!shortCode, instance }).catch(console.error)
    }
  }
)

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

    return {
      isPreview: true,
      isLearning: true,
      currentPageCount: currentPageCount,
      sessionId: 'development',
      doc: unitDoc,
      color: 'primary',
      onInput: instance.onItemInput,
      onLoad: instance.onItemLoad,
      onNewPage: instance.onNewPage,
      onEvaluate: instance.onEvaluate,
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
    setQueryParam(createUrlQuery({ code, isShortCode, type: 'unitSet' }))
    instance.state.set({ unitSetDoc, unitDocs, error: null })
  } catch (e) {
    console.error('Error loading unitSet', e)
    instance.state.set({ unitSetDoc: null, unitDocs: [], error: errorToObject(e) })
  }
}

async function loadUnit ({ code, isShortCode, instance }) {
  console.debug('fetch unit', code, isShortCode)
  try {
    const unitDoc = await loadContentDoc(Unit, code, console.debug, { isShortCode })
    instance.state.set({ unitDoc, currentPageCount: 0, error: null })
    setQueryParam(createUrlQuery({ code, isShortCode, type: 'unit' }))
  } catch (e) {
    console.error('Error loading unit', e)
    instance.state.set({ unitDoc: null, error: errorToObject(e) })
  }
}

function onPageNavUpdate ({ action, newPage, templateInstance, onComplete }) {
  templateInstance.state.set(newPage)
  onComplete()
}

const createUrlQuery = ({ code, isShortCode, type }) => {
  return isShortCode ? { shortCode: code, type } : { _id: code, type }
}
