import { Task } from '../../api/session/Task'
import { createCollection } from '../../factories/collection/createCollection'
import { createMethods } from '../../factories/method/createMethods'
import { rateLimitMethods } from '../../factories/ratelimit/rateLimit'
import { Meteor } from "meteor/meteor"
import { TaskSet } from '../../api/session/TaskSet'

createCollection(Task)

const methods = Object.values(Task.methods)
createMethods(methods)
rateLimitMethods(methods)

Meteor.startup(() => {
  TaskSet.helpers.load((err, res) => {
    if (err) {
      return console.warn(err)
    } else {
      console.info(`[TaskSet]: loaded sets: ${res}`)
    }
  })
})
