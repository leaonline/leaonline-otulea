import { Template } from 'meteor/templating'
import { Tracker } from 'meteor/tracker'
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
import { loadContentDoc } from '../../loading/loadContentDoc'
import '../../components/container/container'
import './overview.scss'
import './overview.html'

Template.overview.onDestroyed(function () {
  const instance = this
  instance.state.clear()
})

Template.overview.onCreated(function () {
  const instance = this
  instance.state.set('color', 'secondary')
  instance.initDependencies({
    language: true,
    translations: {
      de: () => import('./i18n/de')
    },
    tts: true,
    contexts: [Session, TestCycle, UnitSet, Dimension, Level],
    onComplete: async () => {
      instance.state.set('dependenciesComplete', true)
    }
  })

  const { loadAllContentDocs, callMethod, debug } = instance.api
  const loadContentDocuments = async () => {
    const allTestCycles = await loadAllContentDocs(TestCycle, { isLegacy: true }, debug)
    const dimensions = new Set()
    const levels = new Set()

    allTestCycles.forEach(tstCycleDoc => {
      dimensions.add(tstCycleDoc.dimension)
      levels.add(tstCycleDoc.level)
    })

    await loadAllContentDocs(Dimension, { ids: Array.from(dimensions) }, debug)
    await loadAllContentDocs(Level, { ids: Array.from(levels) }, debug)

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

    const dimension = Dimension.collection().findOne({ _id: d })
    const currentDimension = Tracker.nonreactive(() => instance.state.get('dimension'))

    if (dimension && dimension !== currentDimension) {
      // if a dimension has been selected we create a filter list of
      // the levels that are supported by this dimension (linked in UnitSets)
      const levelFilter = new Set()
      TestCycle.collection()
        .find({ dimension: d })
        .forEach(({ level }) => levelFilter.add(level))

      const color = ColorType.byIndex(dimension.colorType)?.type

      instance.state.set({
        levelFilter: Array.from(levelFilter),
        dimension: dimension,
        color: color
      })
    }

    if (!dimension && currentDimension) {
      // if there ware a dimensions but now there is not,
      // reset the dimension and the filters for new selection
      instance.state.set({
        dimension: null,
        levelFilter: null,
        color: 'secondary'
      })
    }

    // TODO if level not exist, reset queryParam
    const level = Level.collection().findOne({ _id: l })
    const currentLevel = Tracker.nonreactive(() => instance.state.get('level'))

    if (level && level !== currentLevel) {
      instance.state.set('level', level)
    }

    if (!level && currentLevel) {
      instance.state.set('level', null)
    }

    // if both selected, select respective test-cyclce
    if (dimension && level) {
      const testCycle = TestCycle.collection().findOne({
        dimension: d,
        level: l
      })
      instance.state.set('selectedTestCycle', testCycle)
    }

    // always scroll to respective target
    const target = getScrollTarget(dimension, level)

    if (target) {
      setTimeout(() => {
        const $target = instance.$(target)
        const scrollTarget = $target && $target.get(0)
        scrollTarget && scrollTarget.scrollIntoView({
          block: 'start',
          inline: 'nearest',
          behavior: 'smooth'
        })
      }, 250)
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
        console.debug('session doc loaded', { sessionDoc })
        if (!sessionDoc) {
          return instance.state.set({
            completedSessionDetected: false,
            abortedSessionDetected: false,
            sessionDoc: null
          })
        }

        if (sessionDoc.completedAt) {
          instance.state.set({ completedSessionDetected: true, sessionDoc })
        }

        else if (testCycle && sessionDoc && sessionDoc.testCycle === testCycle._id) {
          instance.state.set({ abortedSessionDetected: true, sessionDoc })
        }

        else {
          instance.api.debug('warning! session has undefined state', { sessionDoc })
          instance.state.set({
            completedSessionDetected: false,
            abortedSessionDetected: false
          })
        }
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
  colorType () {
    return Template.getState('color')
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
  sessionAborted () {
    return Template.getState('abortedSessionDetected')
  },
  sessionCompleted () {
    return Template.getState('completedSessionDetected')
  },
  sessionDoc () {
    return Template.getState('sessionDoc')
  },
  starting () {
    return Template.getState('starting')
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

        fadeOut('.lea-overview-container', () => {
          onCompleteHandler()
        })
      }, 100)
    }
  })
}

function getScrollTarget (dimension, level) {
  if (!dimension && !level) {
    return 'overview-dimensions-container'
  }

  if (dimension && !level) {
    return 'overview-level-container'
  }

  if (dimension && level) {
    return '.overview-session-container'
  }

  console.warn('Unexpected: no scroll target found!')
}
