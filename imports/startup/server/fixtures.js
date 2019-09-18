import { Meteor } from 'meteor/meteor'
import { Task } from '../../api/session/Task'
import { TaskSet } from '../../api/session/TaskSet'
import exampeTasks from '../../../resources/lea/exampleTasks'

if (Meteor.isDevelopment) {
  Meteor.startup(() => {
    if (Task.collection().find().count() === 0) {
      Object.values(exampeTasks).forEach(taskObj => {
        console.log('[Task] fixture added', Task.collection().insert(taskObj))
      })
    }
    if (TaskSet.collection().find().count() === 0) {
      Task.collection().find().fetch().forEach(taskDoc => {
        console.log('[TaskSet] fixture added', TaskSet.collection().insert({
          dimension: taskDoc.dimension,
          level: taskDoc.level,
          tasks: [ taskDoc._id ]
        }))
      })
    }
  })
}
