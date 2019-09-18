import { Template } from 'meteor/templating'
import { Session } from '../../../api/session/Session'
import { Task } from '../../../api/session/Task'
import { fadeOut } from '../../../utils/animationUtils'
import { Router } from '../../../api/routing/Router'

import './renderer/factory/TaskRendererFactory'
import './task.html'

Template.task.onCreated(function () {
  const instance = this
  const { taskId } = instance.data.params
  const currentPage = Router.queryParam('s') || 0

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
      instance.state.set('currentPage', taskDoc.pages[currentPage])
      instance.state.set('hasNext', taskDoc.pages.length > currentPage)
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
