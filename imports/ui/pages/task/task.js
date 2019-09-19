import { Template } from 'meteor/templating'
import { Session } from '../../../api/session/Session'
import { Task } from '../../../api/session/Task'
import { fadeOut } from '../../../utils/animationUtils'
import { Router } from '../../../api/routing/Router'
import { dataTarget } from '../../../utils/eventUtils'

import '../../components/actionButton/actionButton'
import './renderer/factory/TaskRendererFactory'
import './task.html'


Template.task.onCreated(function () {
  const instance = this
  const { taskId } = instance.data.params
  const currentPageCount = Router.queryParam('p') || 0

  instance.autorun(() => {
    const taskDoc = instance.state.get('taskDoc')
    if (!taskDoc) return

    const { dimension } = taskDoc
    const { level } = taskDoc
    const sessionSub = Session.publications.current.subscribe()
    if (sessionSub.ready()) {
      const sessionDoc = Session.helpers.current({ dimension, level })
      if (sessionDoc) {
        instance.state.set('sessionDoc', sessionDoc)
      } else {
        const route = instance.data.prev()
        fadeOut('.lea-task-container', instance, () => {
          Router.go(route)
        })
      }
    }
  })

  Task.helpers.load(taskId, (err, taskDoc) => {
    if (taskDoc) {
      instance.state.set('taskDoc', taskDoc)
      instance.state.set('currentPageCount', currentPageCount)
      instance.state.set('currentPage', taskDoc.pages[currentPageCount])
      instance.state.set('hasNext', taskDoc.pages.length > currentPageCount + 1)
    } else {
      const route = instance.data.prev()
      fadeOut('.lea-task-container', instance, () => {
        Router.go(route)
      })
    }
  })
})

Template.task.helpers({
  loadComplete () {
    const instance = Template.instance()
    return instance.state.get('sessionDoc') && instance.state.get('taskDoc')
  },
  taskDoc () {
    return Template.getState('taskDoc')
  },
  sessionDoc () {
    return Template.getState('sessionDoc')
  },
  currentPage () {
    return Template.getState('currentPage')
  },
  hasNext () {
    return Template.getState('hasNext')
  },
  hasPrev () {
    return Template.getState('hasPrev')
  }
})

Template.task.events({
  'click .lea-pagenav-button' (event, templateInstance) {
    event.preventDefault()
    const action = dataTarget(event,templateInstance, 'action')
    const taskDoc = templateInstance.state.get('taskDoc')
    const currentPageCount = templateInstance.state.get('currentPageCount')
    const newPage = {}

    if (action === 'next') {
      newPage.currentPageCount = currentPageCount + 1
      newPage.currentPage = taskDoc.pages[newPage.currentPageCount]
    } else if (action === 'back') {
      newPage.currentPageCount = currentPageCount - 1
      newPage.currentPage = taskDoc.pages[newPage.currentPageCount]
    } else {
      throw new Error(`Undefined action: ${action}`)
    }

    if (!newPage.currentPage) {
      throw new Error(`Undefined page for current index ${newPage.currentPageCount}`)
    }

    templateInstance.state.set(newPage)
  },
  'click .lea-pagenav-finish-button' (event, templateInstance) {
    event.preventDefault()


  }
})