import { Meteor } from 'meteor/meteor'
import { onClient, onServer } from '../../utils/archUtils'

export const Videos = {
  name: 'videos',
  label: 'videos.title',
  icon: 'video',
  isConfigDoc: true,
}

Videos.init = onServer(async () => {
  const VideosCollection = Videos.collection()
  if (!(await VideosCollection.findOneAsync())) {
    await VideosCollection.insertAsync({})
  }
  return VideosCollection.findOneAsync({})
})

Videos.schema = {
  welcome: {
    type: String,
    label: 'videos.welcome',
    optional: true,
    isMediaUrl: true,
  },
  overview: {
    type: String,
    label: 'videos.overview',
    optional: true,
    isMediaUrl: true,
  },
  task: {
    type: String,
    label: 'videos.task',
    optional: true,
    isMediaUrl: true,
  },
  complete: {
    type: String,
    label: 'videos.complete',
    optional: true,
    isMediaUrl: true,
  },
  notFound: {
    type: String,
    label: 'videos.notFound',
    optional: true,
    isMediaUrl: true,
  },
}

Videos.publications = {}

Videos.publications.single = {
  name: 'videos.publications.single',
  schema: {},
  numRequests: 1,
  timeInterval: 250,
  run: onServer(() => Videos.collection().find({}, { limit: 1 })),
}

Videos.methods = {}

Videos.methods.update = {
  name: 'videos.methods.update',
  backend: true,
  numRequests: 1,
  timeInterval: 250,
  schema: Object.assign({}, Videos.schema, {
    _id: {
      type: String,
      optional: true,
    },
  }),
  run: onServer(async (updateDoc) => {
    const LogoCollection = Videos.collection()
    const logoDoc = await LogoCollection.findOneAsync()
    if (!logoDoc) {
      return LogoCollection.insertAsync(updateDoc)
    } else {
      return LogoCollection.updateAsync(logoDoc._id, { $set: updateDoc })
    }
  }),
}

Videos.methods.get = {
  name: 'videos.methods.get',
  isPublic: true,
  numRequests: 1,
  timeInterval: 250,
  schema: {},
  run: onServer(async () => Videos.collection().findOneAsync()),
  call: onClient((cb) => {
    Meteor.call(Videos.methods.get.name, cb)
  }),
}

Videos.helpers = {}

let _conf

Videos.helpers.load = (cb = () => {}) => {
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

Videos.helpers.get = (name) => _conf?.[name]
