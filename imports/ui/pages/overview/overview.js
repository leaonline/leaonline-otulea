import { Template } from 'meteor/templating'
import { TTSEngine } from '../../../api/tts/TTSEngine'
import { Dimension } from '../../../contexts/Dimension'
import { Level } from '../../../contexts/Level'
import { Session } from '../../../contexts/session/Session'
import { UnitSet } from '../../../contexts/unitSet/UnitSet'
import { TestCycle } from '../../../contexts/testcycle/TestCycle'
import { ColorType } from '../../../contexts/types/ColorType'
import { dataTarget } from '../../../utils/dataTarget'
import { getUnitSetForDimensionAndLevel } from '../../../contexts/unitSet/api/getUnitSetForDimensionAndLevel'
import { showStoryBeforeUnit } from '../../../contexts/unitSet/api/showStoryBeforeUnit'
import '../../components/container/container'
import './overview.scss'
import './overview.html'
import { loadContentDoc } from '../../loading/loadContentDoc'

Template.overview.onDestroyed(function () {
  const instance = this
  instance.state.clear()
})

Template.overview.onCreated(function () {
  const instance = this
  instance.initDependencies({
    language: true,
    tts: true,
    contexts: [Session, TestCycle, UnitSet, Dimension, Level],
    onComplete: () => instance.state.set('dependenciesComplete', true)
  })

  const { loadAllContentDocs, callMethod } = instance.api
  instance.api.sendError({
    error: new Error('this is a test')
  })

  const loadContentDocuments = async () => {
    const allTestCycles = await loadAllContentDocs(TestCycle, { isLegacy: true })
    const dimensions = new Set()
    const levels = new Set()

    allTestCycles.forEach(tstCycleDoc => {
      dimensions.add(tstCycleDoc.dimension)
      levels.add(tstCycleDoc.level)
    })

    await loadAllContentDocs(Dimension, {
      ids: Array.from(dimensions)
    })

    await loadAllContentDocs(Level, {
      ids: Array.from(levels)
    })

    instance.state.set({
      contentDocsLoadComplete: true,
      dimensionFilter: Array.from(dimensions)
    })
  }

  instance.autorun(() => {
    if (!instance.state.get('contentDocsLoadComplete')) {
      return
    }

    const data = Template.currentData()
    const { d } = data.queryParams
    const { l } = data.queryParams

    let dimension
    let level

    if (typeof d !== 'undefined') {
      dimension = Dimension.collection().findOne(d)

      // if a dimension has been selected we create a filter list of
      // the levels that are supported by this dimension (linked in UnitSets)
      const levelFilter = new Set()
      TestCycle.collection()
        .find({ dimension: d })
        .forEach(({ level }) => levelFilter.add(level))

      instance.state.set({
        levelFilter: Array.from(levelFilter),
        dimension: dimension
      })
    }
    else {
      // otherwise we reset the dimension and the filters for new selection
      instance.state.set({
        dimension: null,
        levelFilter: null
      })
    }

    // TODO if level not exist, reset queryParam

    if (typeof l !== 'undefined') {
      level = Level.collection().findOne(l)
      instance.state.set('level', level)

      setTimeout(() => {
        const $target = instance.$('.overview-level-decision')
        const scrollTarget = $target && $target.get(0)
        scrollTarget && scrollTarget.scrollIntoView({
          block: 'start',
          behavior: 'smooth'
        })
      }, 50)
    }
    else {
      instance.state.set('level', null)
    }

    // if both selected, select respective test-cyclce
    if (dimension && level) {
      const testCycle = TestCycle.collection().findOne({ dimension: d, level: l })
      instance.state.set('selectedTestCycle', testCycle)
    }
  })

  // if we have a testCycle selected we need to check if there is a recent session
  // that has been aborted
  instance.autorun(() => {
    const testCycle = instance.state.get('selectedTestCycle')
    if (!testCycle) return

    callMethod({
      name: Session.methods.byTestCycle.name,
      args: { testCycleId: testCycle._id },
      success: sessionDoc => {
        instance.api.debug('session doc loaded', { sessionDoc })

        const abortedSessionDetected = testCycle && sessionDoc && sessionDoc.testCycle === testCycle._id
        instance.state.set({ abortedSessionDetected, sessionDoc })
      }
    })
  })

  loadContentDocuments()
    .catch(e => {
      instance.api.sendError({ error: e })
    })
})

Template.overview.helpers({
  loadComplete () {
    return Template.getState('dependenciesComplete')
  },
  // ---------------------- // ----------------------
  // Dimension
  // ---------------------- // ----------------------
  dimensionSelected () {
    return Template.getState('dimension')
  },
  isSelectedDimension (_id) {
    const dimension = Template.getState('dimension')
    return dimension?._id === _id
  },
  dimensionDisabled (dimension) {
    return !getUnitSetForDimensionAndLevel({ dimension })
  },

  // return all dimensions, filtered by those, which are defined by
  // our received test-cycles

  allDimensions () {
    const instance = Template.instance()
    if (!instance.state.get('contentDocsLoadComplete')) {
      return
    }

    const query = {}
    const dimensionFilter = instance.state.get('dimensionFilter')
    if (dimensionFilter && dimensionFilter.length > 0) {
      query._id = { $in: dimensionFilter }
    }
    return Dimension.collection().find(query)
  },
  colorTypeName ({ colorType }) {
    return ColorType.byIndex(colorType)?.type
  },
  // ---------------------- // ----------------------
  // LEVELS
  // ---------------------- // ----------------------
  allLevels () {
    const instance = Template.instance()
    if (!instance.state.get('contentDocsLoadComplete')) {
      return
    }

    const query = {}
    const levelFilter = instance.state.get('levelFilter')
    if (levelFilter && levelFilter.length > 0) {
      query._id = { $in: levelFilter }
    }

    return Level.collection().find(query)
  },
  levelSelected () {
    return Template.getState('level')
  },
  isSelectedLevel (_id) {
    const level = Template.getState('level')
    return level?._id === _id
  },
  // ---------------------- // ----------------------
  // SESSION
  // ---------------------- // ----------------------
  levelLoadComplete () {
    const instance = Template.instance()
    return instance.state.get('dependenciesComplete') &&
      instance.state.get('selectedTestCycle')
  },
  levelDescription () {
    const testCycleDoc = Template.getState('selectedTestCycle')
    return testCycleDoc?.selfAssessment
  },
  // ---------------------- // ----------------------
  // SESSION
  // ---------------------- // ----------------------
  sessionDoc () {
    return Template.getState('sessionDoc')
  }
})

Template.overview.events({
  'click .lea-dimension-button' (event, templateInstance) {
    event.preventDefault()
    const d = dataTarget(event, 'dimension')
    templateInstance.api.queryParam({ d, l: null })
  },
  'click .lea-back-button' (event, templateInstance) {
    event.preventDefault()
    const type = dataTarget(event, 'type')
    const target = dataTarget(event)
    const queryParams = {}

    if (type === 'level') {
      queryParams.d = null
      queryParams.l = null
    }

    if (type === 'launch') {
      queryParams.l = null
    }

    templateInstance.api.fadeOut(target, () => {
      templateInstance.api.queryParam(queryParams)
    })
  },
  'click .lea-level-button' (event, templateInstance) {
    event.preventDefault()
    const l = dataTarget(event, 'level')
    templateInstance.api.queryParam({ l })
  },
  'click .lea-restart-button' (event, templateInstance) {
    event.preventDefault()
    restartSession(templateInstance)
  },
  'click .lea-continue-button' (event, templateInstance) {
    event.preventDefault()
    const sessionDoc = templateInstance.state.get('sessionDoc')
    const sessionId = sessionDoc._id

    launch({
      name: Session.methods.continue.name,
      args: { sessionId },
      templateInstance,
      isFreshStart: false
    })
  },
  'click .lea-overview-confirm-button' (event, templateInstance) {
    event.preventDefault()
    startNewSession(templateInstance)
  }
})

function restartSession (templateInstance) {
  const sessionDoc = templateInstance.state.get('sessionDoc')
  const sessionId = sessionDoc._id

  templateInstance.api.callMethod({
    name: Session.methods.cancel.name,
    args: { sessionId },
    prepare: () => templateInstance.state.set('starting', true),
    success: () => {
      // after we obsoleted the old session we start a new one as we do
      // when the user clicks the launch button
      startNewSession(templateInstance)
    }
  })
}

function startNewSession (templateInstance) {
  const selectedTestCycle = templateInstance.state.get('selectedTestCycle')
  const testCycleId = selectedTestCycle._id
  launch({
    name: Session.methods.start.name,
    args: { testCycleId },
    templateInstance,
    isFreshStart: true
  })
}

function launch ({ templateInstance, name, args, isFreshStart }) {
  templateInstance.api.callMethod({
    name: name,
    args: args,
    prepare: () => templateInstance.state.set('starting', true),
    receive: () => templateInstance.state.set('starting', false),
    failure: er => {
      // if there is the rare case that the session exists although the user
      // intended to launch a new session, we try to restart the session
      if (er?.details === 'session.sessionExists') {
        restartSession(templateInstance)
      }
    },
    success: sessionDoc => {
      TTSEngine.stop()
      const { fadeOut, debug } = templateInstance.api
      const { next, story } = templateInstance.data

      setTimeout(async () => {
        // a new session can either begin with a story (no items included) or
        // go to the fist unit, which is decided here but routed externally
        const sessionId = sessionDoc._id
        const unitId = sessionDoc.currentUnit
        let unitSetDoc = UnitSet.collection().findOne(sessionDoc.unitSet)

        // if the unit set doc does not exist at this point we need to fetch it
        if (!unitSetDoc) {
          debug('UnitSet not found, attempt to fetch it')
          unitSetDoc = await loadContentDoc(UnitSet, sessionDoc.unitSet)
        }

        const shouldShowStory = isFreshStart && showStoryBeforeUnit(unitId, unitSetDoc)
        const onCompleteHandler = shouldShowStory
          ? () => story({ sessionId, unitId, unitSetId: unitSetDoc._id })
          : () => next({ sessionId, unitId })

        fadeOut('.lea-overview-container', onCompleteHandler)
      }, 100)
    }
  })
}
