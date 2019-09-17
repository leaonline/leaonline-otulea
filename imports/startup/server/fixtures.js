import exampeTasks from '../../../resources/lea/exampleTasks'
import { Task } from '../../api/session/Task'
import { TaskSet } from '../../api/session/TaskSet'

if (Meteor.isDevelopment) {
  Meteor.startup(() => {
    if (Task.collection().find().count() === 0) {
      Object.values(exampeTasks).forEach(taskObj => Task.collection().insert(taskObj))
    }
    if (TaskSet.collection().find().count() === 0) {
      Task.collection().find().fetch().forEach(taskDoc => {
        TaskSet.collection().insert({ dimension: taskDoc.dimension, level: taskDoc.level, tasks: [ taskDoc._id ] })
      })
    }
  })
}
