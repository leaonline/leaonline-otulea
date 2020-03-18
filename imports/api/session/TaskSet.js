import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'

import { TaskSet } from 'meteor/leaonline:interfaces/TaskSet'
import { UrlService } from '../urls/UrlService'

TaskSet.helpers = {}

const _localCollection = new Mongo.Collection(null)
let _loaded = false
TaskSet.collection = () => _localCollection

TaskSet.helpers.loaded = () => _loaded

const origin = Meteor.absoluteUrl()
const headers = { headers: { origin: origin } }

TaskSet.helpers.load = callback => {
  // the method can be called from the client, too
  // se we may add headers with the origin
  const callRequest = Meteor.isClient
    ? TaskSet.httpRoutes.all
    : Object.assign({}, TaskSet.httpRoutes.all, headers)

  UrlService.content.call(callRequest, {}, (err, allSets) => {
    if (err) return callback(err)

    // skip further processing if no tassk have been received
    if (!allSets || allSets.length === 0) {
      return callback(undefined, allSets)
    }

    allSets.forEach(setDoc => {
      if (_localCollection.findOne(setDoc._id)) {
        _localCollection.upsert(setDoc._id, setDoc)
      } else {
        _localCollection.insert(setDoc)
      }
    })

    _loaded = allSets && allSets.length > 0
    callback(null, _loaded && allSets.length)
  })
}

TaskSet.helpers.getInitialSet = ({ dimension, level }) => {
  return TaskSet.collection().findOne({ dimension, level })
}

TaskSet.helpers.hasSet = ({ dimension, level }) => {
  const query = {}
  if (dimension) {
    query.dimension = dimension
  }
  if (level) {
    query.level = level
  }
  return _localCollection.findOne(query)
}

export { TaskSet }
