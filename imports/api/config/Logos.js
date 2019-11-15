import { Meteor } from 'meteor/meteor'
import { onClient, onServer } from '../../utils/archUtils'
import { getCollection } from '../../utils/collectionuUtils'

export const Logos = {
  name: 'logos',
  label: 'logos.title',
  icon: 'images'
}

Logos.schema = {
  mainLogo: {
    type: String,
    optional: true
  },
  footerLogos: {
    type: Array,
    optional: true
  },
  'footerLogos.$': {
    type: String
  }
}

let _collection

Logos.collection = function () {
  if (_collection) {
    _collection = getCollection(Logos)
  }
  return _collection
}

Logos.publications = {}

Logos.publications.single = {
  name: 'logos.publications.single',
  isPublic: true,
  schema: {},
  numRequests: 1,
  timeInterval: 250,
  run: onServer(function () {
    return Logos.collection().find({}, { limit: 1 })
  })
}

Logos.methods = {}

Logos.methods.update = {
  name: 'logos.methods.update',
  isPublic: true, // FIXME only backend editors and admins
  numRequests: 1,
  timeInterval: 250,
  schema: Object.assign({}, Logos.schema, {
    _id: {
      type: String,
      optional: true
    }
  }),
  run: onServer(function ({ mainLogo, footerLogos }) {
    const LogoCollection = Logos.collection()
    const logoDoc = LogoCollection.findOne()
    if (!logoDoc) {
      return LogoCollection.insert({ mainLogo, footerLogos })
    } else {
      return LogoCollection.update(logoDoc._id, { $set: { mainLogo, footerLogos } })
    }
  })
}

Logos.methods.get = {
  name: 'logos.methods.get',
  isPublic: true,
  numRequests: 1,
  timeInterval: 250,
  schema: {},
  run: onServer(function ({ name } = {}) {
    return Logos.collection().findOne()
  }),
  call: onClient(function (cb) {
    Meteor.call(Logos.methods.get.name, cb)
  })
}
