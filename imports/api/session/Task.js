import { Mongo } from 'meteor/mongo'
import { Task } from 'meteor/leaonline:interfaces/Task'
import { UrlService } from '../urls/UrlService'

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

export { Task }
