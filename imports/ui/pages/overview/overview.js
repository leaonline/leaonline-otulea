import { Template } from 'meteor/templating'
import { Dimensions } from '../../../api/session/Dimensions'
import { Levels } from '../../../api/session/Levels'
import { Session } from '../../../api/session/Session'
import { Router } from '../../../api/routing/Router'
import { dataTarget } from '../../../utils/eventUtils'

import '../../components/actionButton/actionButton'
import '../../components/textgroup/textgroup'
import './overview.scss'
import './overview.html'

const dimensions = Object.values(Dimensions)
const levels = Object.values(Levels)

Template.overview.onCreated(function () {
  const instance = this
  instance.autorun(() => {
    const sessionSub = Session.publications.current.subscribe()
    if (sessionSub.ready()) {
      instance.state.set('sessionLoadComplete', true)
    }
  })
})

Template.overview.helpers({
  // ---------------------- // ----------------------
  // DIMENSIONS
  // ---------------------- // ----------------------
  dimensions () {
    return dimensions
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
    return levels
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
    return Template.getState('sessionAlreadyRunning')
  }
})

Template.overview.events({
  'click .lea-dimension-button' (event, templateInstance) {
    event.preventDefault()
    const dimensionName = dataTarget(event, templateInstance, 'dimension')
    templateInstance.state.set('dimension', Dimensions[ dimensionName ])
  },
  'click .lea-back-button' (event, templateInstance) {
    event.preventDefault()
    templateInstance.state.set('dimension', null)
    templateInstance.state.set('level', null)
  },
  'click .lea-level-button' (event, templateInstance) {
    event.preventDefault()
    const levelName = dataTarget(event, templateInstance, 'level')
    const dimension = templateInstance.state.get('dimension')
    const level = Levels[ levelName ]
    console.log(dimension, level)
    if (Session.helpers.current({ dimension: dimension.name, level: level.name })) {
      templateInstance.state.set('sessionAlreadyRunning', true)
    }
    templateInstance.state.set('level', level)

    setTimeout(() => {
      const $target = templateInstance.$('.overview-level-decision')
      const scrollTarget = $target && $target.get(0)
      scrollTarget && scrollTarget.scrollIntoView({ block: 'end', behavior: 'smooth' })
    }, 50)
  },
  'click .lea-overview-confirm-button' (event, templateInstance) {
    event.preventDefault()
    const dimension = templateInstance.state.get('dimension')
    const level = templateInstance.state.get('level')
    const restartStr = dataTarget(event, templateInstance, 'restart')
    const restart = Boolean(restartStr)

    Session.methods.start.call({ dimension: dimension.name, level: level.name, restart }, (err, taskId) => {
      const route = templateInstance.data.next({
        dimension: dimension.name,
        level: level.name,
        taskId: taskId
      })
      Router.go(route)
    })
  }
})
