import { Template } from 'meteor/templating'
import { Dimensions } from '../../../api/session/Dimensions'
import { Levels } from '../../../api/session/Levels'
import { Session } from '../../../api/session/Session'
import { Router } from '../../../api/routing/Router'
import { TTSEngine } from '../../../api/tts/TTSEngine'
import { dataTarget } from '../../../utils/eventUtils'
import { fadeOut } from '../../../utils/animationUtils'
import { TaskSet } from '../../../api/session/TaskSet'
import { LeaCoreLib } from '../../../api/core/LeaCoreLib'
import '../../components/container/container'
import './overview.scss'
import './overview.html'

const components = LeaCoreLib.components
const componentsLoaded = components.load([
  components.template.actionButton,
  components.template.textGroup ])

const _dimensions = Object.values(Dimensions.types)
const _levels = Object.values(Levels.types)

Template.overview.onDestroyed(function () {
  const instance = this
  instance.state.clear()
})

Template.overview.onCreated(function () {
  const instance = this

  if (!TaskSet.helpers.loaded()) {
    TaskSet.helpers.load((err, res) => {
      if (err) {
        // TODO handle
        return console.warn(err)
      }
      instance.state.set('allTasksLoaded', !!res)
    })
  } else {
    instance.state.set('allTasksLoaded', true)
  }

  instance.autorun(() => {
    const sessionSub = Session.publications.current.subscribe()
    if (sessionSub.ready()) {
      instance.state.set('sessionLoadComplete', true)
    }
  })

  instance.autorun(() => {
    const sessionLoadComplete = instance.state.get('sessionLoadComplete')
    if (!sessionLoadComplete) return

    const data = Template.currentData()
    const { d } = data.queryParams
    const { l } = data.queryParams

    let dimension

    if (typeof d !== 'undefined') {
      const dimensionIndex = parseInt(d, 10)
      dimension = _dimensions.find(el => el.index === dimensionIndex)
      instance.state.set('dimension', dimension)
    } else {
      instance.state.set('dimension', null)
    }

    if (typeof l !== 'undefined') {
      const levelIndex = parseInt(l, 10)
      const level = _levels.find(el => el.index === levelIndex)
      const currentSession = Session.helpers.current({ dimension: dimension.name, level: level.name })

      instance.state.set('currentSession', currentSession)
      instance.state.set('level', level)

      setTimeout(() => {
        const $target = instance.$('.overview-level-decision')
        const scrollTarget = $target && $target.get(0)
        scrollTarget && scrollTarget.scrollIntoView({ block: 'start', behavior: 'smooth' })
      }, 50)
    } else {
      instance.state.set('level', null)
    }
  })
})

Template.overview.helpers({
  loadComplete () {
    return componentsLoaded.get()
  },
  // ---------------------- // ----------------------
  // DIMENSIONS
  // ---------------------- // ----------------------
  dimensions () {
    const allSetsLoaded = Template.getState('allTasksLoaded')
    return allSetsLoaded && _dimensions
  },
  dimensionSelected () {
    return Template.getState('dimension')
  },
  isSelectedDimension (name) {
    const dimension = Template.getState('dimension')
    return dimension && dimension.name === name
  },
  dimensionDisabled (dimension) {
    return !TaskSet.helpers.hasSet({ dimension })
  },
  // ---------------------- // ----------------------
  // LEVELS
  // ---------------------- // ----------------------
  levels () {
    return _levels
  },
  levelSelected () {
    return Template.getState('level')
  },
  isSelectedLevel (name) {
    const level = Template.getState('level')
    return level && level.name === name
  },
  dimensionLevel () {
    const instance = Template.instance()
    const dimension = instance.state.get('dimension')
    const level = instance.state.get('level')
    return level && dimension && dimension.descriptions[ level.name ]
  },
  levelDisabled (dimension, level) {
    return !TaskSet.helpers.hasSet({ dimension, level })
  },
  // ---------------------- // ----------------------
  // SESSION
  // ---------------------- // ----------------------
  sessionLoadComplete () {
    return Template.getState('sessionLoadComplete')
  },
  sessionAlreadyRunning () {
    return Template.getState('currentSession') && !Template.getState('starting')
  },
  starting () {
    return Template.getState('starting')
  }
})

Template.overview.events({
  'click .lea-dimension-button' (event, templateInstance) {
    event.preventDefault()
    const dimensionName = dataTarget(event, templateInstance, 'dimension')
    const dimension = Dimensions.types[ dimensionName ]
    const d = dimension.index
    Router.queryParam({ d })
  },
  'click .lea-back-button' (event, templateInstance) {
    event.preventDefault()
    const dimension = templateInstance.state.get('dimension')
    const level = templateInstance.state.get('level')
    const target = dataTarget(event, templateInstance)

    const queryParams = { l: null }
    if (dimension && !level) {
      queryParams.d = null
    }

    fadeOut(target, templateInstance, () => {
      Router.queryParam(queryParams)
    })
  },
  'click .lea-level-button' (event, templateInstance) {
    event.preventDefault()
    const levelName = dataTarget(event, templateInstance, 'level')
    const level = Levels.types[ levelName ]

    const l = level.index
    Router.queryParam({ l })
  },
  'click .lea-overview-confirm-button' (event, templateInstance) {
    event.preventDefault()
    const dimension = templateInstance.state.get('dimension')
    const level = templateInstance.state.get('level')
    const restartStr = dataTarget(event, templateInstance, 'restart')
    const restart = Boolean(restartStr)

    templateInstance.state.set('starting', true)
    const options = { dimension: dimension.name, level: level.name, continueAborted: !restart }
    console.log(options)
    Session.methods.start.call(options, (err, { taskId, sessionId }) => {
      if (err) {
        console.error(err)
        templateInstance.state.set('starting', false)
        return
      }

      const route = templateInstance.data.next({ taskId, sessionId })
      if (err || !taskId) {
        console.log(err)
        return
      }
      TTSEngine.stop()

      setTimeout(() => {

        fadeOut('.lea-overview-container', templateInstance, () => {
          Router.go(route)
        })
      }, 100)
    })
  }
})
