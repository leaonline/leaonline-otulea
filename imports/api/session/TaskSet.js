import { ReactiveVar } from 'meteor/reactive-var'
import { TaskSet } from 'meteor/leaonline:interfaces/TaskSet'
import { UrlService } from '../urls/UrlService'

TaskSet.helpers = {}

const _localCollection = new Mongo.Collection(null)
let _loaded = false
TaskSet.collection = () => _localCollection

TaskSet.helpers.loaded = () => _loaded

TaskSet.helpers.load = callback => {
  UrlService.content.call(TaskSet.httpRoutes.all, {}, (err, allSets) => {
    if (err) {
      return callback(err)
    }
    ;(allSets || []).forEach(setDoc =>   {
      if (_localCollection.findOne(setDoc._id)) {
        _localCollection.upsert(setDoc._id, setDoc)
      } else {
        _localCollection.insert(setDoc)
      }
    })
    _loaded = allSets && allSets.length > 0
    callback(null, _loaded)
  })
}

TaskSet.helpers.getInitialSet = ({ dimension, level }) => {
  return TaskSet.collection().findOne() // fixme use dimension and level when all tasks are supported
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
