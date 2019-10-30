/* global $ */
import { Template } from 'meteor/templating'
import { Dimensions } from '../../../api/session/Dimensions'
import { Levels } from '../../../api/session/Levels'
import { Routes } from '../../../api/routing/Routes'
import { Router } from '../../../api/routing/Router'
import { Session } from '../../../api/session/Session'
import { fadeOut } from '../../../utils/animationUtils'
import { LeaCoreLib } from '../../../api/core/LeaCoreLib'
import './navbar.html'

const components = LeaCoreLib.components
const loaded = components.load([ components.template.actionButton ])

const _dimensions = Object.values(Dimensions)

Template.navbar.onDestroyed(function () {
  const instance = this
  instance.state.clear()
})

Template.navbar.onCreated(function () {
  const instance = this
  instance.progress = new ReactiveVar()
  instance.labels = new ReactiveVar()

  instance.autorun(() => {
    const data = Template.currentData()
    const { sessionDoc } = data
    const { showProgress } = data

    if (!sessionDoc) {
      return instance.state.set({
        showProgress: false
      })
    }

    const { currentTask } = sessionDoc
    const { tasks } = sessionDoc
    const dimension = Dimensions.types[ sessionDoc.dimension ]
    const level = Levels.types[ sessionDoc.level ]

    instance.progress.set({
      value: Session.helpers.getProgress(sessionDoc),
      current: tasks.indexOf(currentTask) + 1,
      max: tasks.length,
      type: dimension.type
    })
    instance.labels.set({
      dimension: dimension.label,
      level: level.label,
      type: dimension.type
    })
    instance.state.set({ showProgress })
  })
})

Template.navbar.helpers({
  loadComplete () {
    return loaded.get()
  },
  showProgress () {
    return Template.instance().data.showProgress !== false
  },
  progress () {
    return Template.instance().progress.get()
  },
  labels () {
    return Template.instance().labels.get()
  },
  dimensions () {
    return _dimensions
  }
})

Template.navbar.events({
  'click .navbar-overview-button' (event, templateInstance) {
    event.preventDefault()
    const root = templateInstance.data.root
    const route = Routes.overview
    if (root) {
      fadeOut(root, { $ }, () => {
        Router.go(route)
      })
    } else {
      Router.go(route)
    }
  }
})
