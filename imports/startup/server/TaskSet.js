import { Meteor } from 'meteor/meteor'
import { TaskSet } from '../../api/session/TaskSet'
import { createCollection } from '../../factories/collection/createCollection'

createCollection(TaskSet)

Meteor.startup(() => {
  TaskSet.helpers.load((err, res) => {
    if (err) {
      return console.error(err)
    } else if (!res || !res.length) {
      console.warn(new Error('[TaskSet]: Warning! Expected to receive sets but got nothing or empty. Continue with 0 task sets.'))
    } else {
      console.info(`[TaskSet]: loaded sets: ${res}`)
    }
  })
})
