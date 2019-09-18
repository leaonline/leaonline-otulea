import { Template } from 'meteor/templating'
import { Session } from '../../../api/session/Session'
import './task.html'
import { Task } from '../../../api/session/Task'

Template.task.onCreated(function () {
  const instance = this
  const { taskId } = instance.data.params

  instance.autorun(() => {
    const taskDoc = instance.state.get('taskDoc')
    if (!taskDoc) return

    const { dimension } = taskDoc
    const { level } = taskDoc
    const sessionSub = Session.publications.current.subscribe()
    if (sessionSub.ready()) {
      const sessionDoc = Session.helpers.current({ dimension, level })
      instance.state.set('sessionDoc', sessionDoc)
    }
  })

  Task.helpers.load(taskId, (err, taskDoc) => {
    instance.state.set('taskDoc', taskDoc)
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
  }
})
