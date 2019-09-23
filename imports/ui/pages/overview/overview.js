import { Template } from 'meteor/templating'
import { Dimensions } from '../../../api/session/Dimensions'
import { Levels } from '../../../api/session/Levels'
import { Session } from '../../../api/session/Session'
import { Router } from '../../../api/routing/Router'
import { TTSEngine } from '../../../api/tts/TTSEngine'
import { dataTarget } from '../../../utils/eventUtils'
import { fadeOut } from '../../../utils/animationUtils'

import '../../components/actionButton/actionButton'
import '../../components/textgroup/textgroup'
import './overview.scss'
import './overview.html'

const _dimensions = Object.values(Dimensions)
const _levels = Object.values(Levels)

Template.overview.onCreated(function () {
  const instance = this

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
        scrollTarget && scrollTarget.scrollIntoView({ block: 'end', behavior: 'smooth' })
      }, 50)
    } else {
      instance.state.set('level', null)
    }
  })
})

Template.overview.helpers({
  // ---------------------- // ----------------------
  // DIMENSIONS
  // ---------------------- // ----------------------
  dimensions () {
    return _dimensions
  },
  dimensionSelected () {
    return Template.getState('dimension')
  },
  isSelectedDimension (name) {
    const dimension = Template.getState('dimension')
    return dimension && dimension.name === name
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
  // ---------------------- // ----------------------
  // SESSION
  // ---------------------- // ----------------------
  sessionLoadComplete () {
    return Template.getState('sessionLoadComplete')
  },
  sessionAlreadyRunning () {
    return Template.getState('currentSession')
  }
})

Template.overview.events({
  'click .lea-dimension-button' (event, templateInstance) {
    event.preventDefault()
    const dimensionName = dataTarget(event, templateInstance, 'dimension')
    const dimension = Dimensions[ dimensionName ]
    const d = dimension.index
    Router.queryParam({ d })
  },
  'click .lea-back-button' (event, templateInstance) {
    event.preventDefault()
    fadeOut('.overview-level-container', templateInstance, () => {
      Router.queryParam({ d: null, l: null })
    })
  },
  'click .lea-level-button' (event, templateInstance) {
    event.preventDefault()
    const levelName = dataTarget(event, templateInstance, 'level')
    const level = Levels[ levelName ]

    const l = level.index
    Router.queryParam({ l })
  },
  'click .lea-overview-confirm-button' (event, templateInstance) {
    event.preventDefault()
    const dimension = templateInstance.state.get('dimension')
    const level = templateInstance.state.get('level')
    const restartStr = dataTarget(event, templateInstance, 'restart')
    const restart = Boolean(restartStr)

    Session.methods.start.call({ dimension: dimension.name, level: level.name, restart }, (err, taskId) => {
      const route = templateInstance.data.next({ taskId: taskId })
      if (err || !taskId) {
        console.log(err)
        return
      }
      TTSEngine.stop()
      fadeOut('.lea-overview-container', templateInstance, () => {
        Router.go(route)
      })
    })
  }
})
