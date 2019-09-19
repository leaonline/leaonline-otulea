import { Meteor } from 'meteor/meteor'
import { Task } from '../../api/session/Task'
import { TaskSet } from '../../api/session/TaskSet'
import exampeTasks from '../../../resources/lea/exampleTasks'
import { Dimensions } from '../../api/session/Dimensions'
import { Levels } from '../../api/session/Levels'

if (Meteor.isDevelopment) {
  Meteor.startup(() => {
    if (Task.collection().find().count() === 0) {
      Object.values(exampeTasks).forEach(taskObj => {
        console.log('[Task] fixture added', Task.collection().insert(taskObj))
      })
    }
    if (TaskSet.collection().find().count() === 0) {
      const allDimensions = Object.keys(Dimensions)
      const allLevels = Object.keys(Levels)

      allDimensions.forEach(dimension => {
        allLevels.forEach(level => {
          const tasks = Task.collection().find({dimension, level}).fetch().map(taskDoc => taskDoc._id)
          if (tasks.length === 0) return
          console.log('[TaskSet] fixture added', TaskSet.collection().insert({ dimension, level, tasks }))
        })
      })
    }
  })
}
