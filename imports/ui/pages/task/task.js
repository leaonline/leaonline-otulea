import { Template } from 'meteor/templating'
import { Session } from '../../../api/session/Session'
import { Task } from '../../../api/session/Task'
import { Response } from '../../../api/session/Response'
import { Router } from '../../../api/routing/Router'
import { Dimensions } from '../../../api/session/Dimensions'
import { Levels } from '../../../api/session/Levels'
import { fadeOut } from '../../../utils/animationUtils'
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
        const {currentTask} = sessionDoc
        const {tasks} = sessionDoc

        instance.state.set('progress', Session.helpers.getProgress(sessionDoc))
        instance.state.set('currentTaskCount', tasks.indexOf(currentTask) + 1)
        instance.state.set('maxTasksCount', tasks.length)
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
      instance.state.set('maxPages', taskDoc.pages.length)
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
  currentTaskCount () {
    return Template.getState('currentTaskCount')
  },
  maxTasksCount() {
    return Template.getState('maxTasksCount')
  },
  sessionDoc () {
    return Template.getState('sessionDoc')
  },
  dimension () {
    const sessionDoc = Template.getState('sessionDoc')
    if (!sessionDoc) return

    return Dimensions[sessionDoc.dimension]
  },
  level () {
    const sessionDoc = Template.getState('sessionDoc')
    if (!sessionDoc) return

    return Levels[sessionDoc.level]
  },
  currentPage () {
    return Template.getState('currentPage')
  },
  currentPageCount () {
    return Template.getState('currentPageCount') + 1
  },
  maxPages () {
    return Template.getState('maxPages')
  },
  hasNext () {
    return Template.getState('hasNext')
  },
  hasPrev () {
    return Template.getState('hasPrev')
  },
  progress () {
    return Template.getState('progress')
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
      newPage.hasNext = (newPage.currentPageCount + 1) < taskDoc.pages.length
    }

    if (action === 'back') {
      newPage.currentPageCount = currentPageCount - 1
      newPage.currentPage = taskDoc.pages[newPage.currentPageCount]
      newPage.hasNext = (newPage.currentPageCount + 1) < taskDoc.pages.length
    }

    if (!newPage.currentPage) {
      throw new Error(`Undefined page for current index ${newPage.currentPageCount}`)
    }

    templateInstance.state.set(newPage)
  },
  'click .lea-pagenav-finish-button' (event, templateInstance) {
    event.preventDefault()
    const { taskId } = templateInstance.data.params
    const sessionDoc = templateInstance.state.get('sessionDoc')
    const answers = [] // TODO
    const sessionId = sessionDoc._id

    // WHEN A TASK IS FINISHED, THE FOLLOWING
    // STEPS ARE TAKEN
    // 1. SEND RESPONSES
    // 2. UPDATE SESSION
    // 3. CHECK IF SESSION IS COMPLETE
    //  a - if complete call finish()
    //  b - else call next()
    Response.methods.send.call({ taskId, sessionId, answers }, (err, responseId) => {
      if (err) {
        console.error(err)
        return
      }
      Session.methods.update.call({ sessionId, responseId }, (err, taskId) => {
        if (err) {
          console.error(err)
          return
        }
        const route = taskId
          ? templateInstance.data.next({taskId})
          : templateInstance.data.finish()
        console.log(route)
        fadeOut('.lea-task-container', templateInstance, () => {
          x<Router.go(route)
        })
      })
    })
  }
})