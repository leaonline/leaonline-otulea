/* global $ */
import { Template } from 'meteor/templating'
import { ColorType } from '../../../types/ColorType'
import './navbar.html'

Template.navbar.onDestroyed(function () {
  const instance = this
  instance.state.clear()
})

Template.navbar.onCreated(function () {
  const instance = this

  instance.initDependencies({
    language: true,
    tts: true,
    onComplete: () => instance.state.set('dependenciesLoaded', true)
  })

  instance.autorun(() => {
    const data = Template.currentData()
    const { sessionDoc, showProgress, dimensionDoc, levelDoc, unitSetDoc } = data

    if (!showProgress || !sessionDoc || !unitSetDoc || !dimensionDoc || !levelDoc) {
      return instance.state.set({
        showProgress: false
      })
    }

    const colorType = ColorType.byIndex(dimensionDoc.colorType)?.type || 'primary'

    const { currentUnit } = sessionDoc
    const { units } = unitSetDoc
    const current = units.indexOf(currentUnit) + 1
    const max = units.length
    const value = (current / (max + 1)) * 100
    const progress = {
      current, max, value,
      type: colorType
    }

    const labels = {
      dimension: dimensionDoc?.title,
      level: levelDoc?.title,
      type: colorType
    }

    const loadComplete = true
    instance.state.set({ showProgress, progress, labels, loadComplete })
  })
})

Template.navbar.helpers({
  loadComplete () {
    const instance = Template.instance()
    return instance.state.get('dependenciesLoaded') &&
      instance.state.get('loadComplete')
  },
  showProgress () {
    return Template.getState('showProgress')
  },
  progress () {
    return Template.getState('progress')
  },
  labels () {
    return Template.getState('labels')
  }
})

Template.navbar.events({
  'click .navbar-overview-button' (event, templateInstance) {
    event.preventDefault()
    if (templateInstance.data.onExit) {
      templateInstance.data.onExit()
    }
  }
})
