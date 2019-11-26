import { Meteor } from 'meteor/meteor'
import { onClient, onServer } from '../../utils/archUtils'
import { getCollection } from '../../utils/collectionuUtils'

export const Videos = {
  name: 'videos',
  label: 'videos.title',
  icon: 'video'
}

Videos.schema = {
  welcome: {
    type: String,
    label: 'videos.welcome',
    optional: true
  },
  overview: {
    type: String,
    label: 'videos.overview',
    optional: true
  },
  task: {
    type: String,
    label: 'videos.task',
    optional: true
  },
  complete: {
    type: String,
    label: 'videos.complete',
    optional: true
  },
  notFound: {
    type: String,
    label: 'videos.notFound',
    optional: true
  }
}

let _collection

Videos.collection = function () {
  if (_collection) {
    _collection = getCollection(Videos)
  }
  return _collection
}

Videos.publications = {}

Videos.publications.single = {
  name: 'videos.publications.single',
  isPublic: true, // FIXME only backend editors and admins
  schema: {},
  numRequests: 1,
  timeInterval: 250,
  run: onServer(function () {
    return Videos.collection().find({}, { limit: 1 })
  })
}

Videos.methods = {}

Videos.methods.update = {
  name: 'videos.methods.update',
  isPublic: true, // FIXME only backend editors and admins
  numRequests: 1,
  timeInterval: 250,
  schema: Object.assign({}, Videos.schema, {
    _id: {
      type: String,
      optional: true
    }
  }),
  run: onServer(function (updateDoc) {
    const LogoCollection = Videos.collection()
    const logoDoc = LogoCollection.findOne()
    if (!logoDoc) {
      return LogoCollection.insert(updateDoc)
    } else {
      return LogoCollection.update(logoDoc._id, { $set: updateDoc })
    }
  })
}

Videos.methods.get = {
  name: 'videos.methods.get',
  isPublic: true,
  numRequests: 1,
  timeInterval: 250,
  schema: {},
  run: onServer(function () {
    return Videos.collection().findOne()
  }),
  call: onClient(function (cb) {
    Meteor.call(Videos.methods.get.name, cb)
  })
}

Videos.helpers = {}

let _conf

Videos.helpers.load = function (cb = () => {}) {
  if (_conf) {
    return cb(null, _conf)
  } else {
    Videos.methods.get.call((err, res) => {
      if (err) return cb(err)
      _conf = res
      return cb(_conf)
    })
  }
}

Videos.helpers.get = function (name) {
  return _conf && _conf[name]
}
