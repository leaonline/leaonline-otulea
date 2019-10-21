import { Meteor } from 'meteor/meteor'
import { Role } from '../accounts/Role'
import { Group } from '../accounts/Group'
import { getCollection } from '../../utils/collectionuUtils'
import { onClient, onServer } from '../../utils/archUtils'
import { Task } from 'meteor/leaonline:interfaces/Task'

let _TaskCollection
Task.collection = function () {
  if (!_TaskCollection) {
    _TaskCollection = getCollection(Task)
  }
  return _TaskCollection
}

Task.helpers = {
  load (taskId, cb) {
    // TODO HTTP GET from content server
    Task.methods.load.call({ taskId }, cb)
  }
}

Task.methods.load = {
  name: 'task.methods.load',
  schema: {
    taskId: String
  },
  roles: [ Role.runSession.value, Role.test.value ],
  group: Group.field.value,
  numRequests: 1,
  timeInterval: 1000,
  run: onServer(function ({ taskId }) {
    return Task.collection().findOne(taskId)
  }),
  call: onClient(function ({ taskId }, cb) {
    Meteor.call(Task.methods.load.name, { taskId }, cb)
  })
}

export { Task }