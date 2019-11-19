import { Mongo } from 'meteor/mongo'
import { HTTP } from 'meteor/http'
import { Task } from 'meteor/leaonline:interfaces/Task'
import { UrlService } from '../urls/UrlService'
import { onServer } from '../../utils/archUtils'
import { Role } from '../accounts/Role'
import { Group } from '../accounts/Group'

const _TaskCollection = new Mongo.Collection(null)

Task.collection = () => _TaskCollection

Task.helpers = {}

Task.helpers.load = async (taskId) => {
  return new Promise((resolve, reject) => {
    const existingTaskDoc = _TaskCollection.findOne(taskId)
    if (existingTaskDoc) {
      return resolve(existingTaskDoc)
    }

    UrlService.content.call(Task.httpRoutes.byTaskId, { taskId }, (err, taskDoc) => {
      if (err) return reject(err)
      if (!taskDoc) return resolve()
      if (_TaskCollection.findOne(taskDoc._id)) {
        _TaskCollection.update(taskDoc._id, taskDoc)
      } else {
        _TaskCollection.insert(taskDoc)
      }
      return resolve(taskDoc)
    })
  })
}

const sessionCredential = Meteor.settings.sessionCredential
const responseUrl = Meteor.settings.public.hosts.sessions.responseUrl

Task.methods.submit = {
  name: 'task.methods.submit',
  schema: {
    userId: String,
    sessionId: String,
    type: String,
    taskId: String,
    responses: {
      type: Array,
      optional: true
    },
    'responses.$': String,
    contentId: {
      type: String,
      optional: true
    },
    page: Number
  },
  roles: [ Role.runSession.value, Role.test.value ],
  group: Group.field.value,
  numRequests: 10,
  timeInterval: 1000,
  run: onServer(function ({ userId, sessionId, type, taskId, responses, contentId, page }) {
    return HTTP.post(responseUrl, {
      data: { userId, sessionId, type, taskId, responses, contentId, page: page.toString(10) },
      headers: {
        'X-Auth-Token': sessionCredential
      }
    })
  })
}

export { Task }
