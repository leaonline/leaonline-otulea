import { getCollection } from '../../utils/collectionuUtils'
import { onClient, onServer } from '../../utils/archUtils'

export const Legal = {
  name: 'legal',
  label: 'legal.title',
  icon: 'info'
}

Legal.schema = {
  imprint: {
    type: String,
    label: 'legal.imprint',
    optional: true,
    max: 5000,
    autoform: {
      type: 'markdown'
    }
  },
  privacy: {
    type: String,
    label: 'legal.privacy',
    optional: true,
    max: 5000,
    autoform: {
      type: 'markdown'
    }
  },
  terms: {
    type: String,
    label: 'legal.terms',
    optional: true,
    max: 5000,
    autoform: {
      type: 'markdown'
    }
  },
  contact: {
    type: String,
    label: 'legal.contact',
    optional: true,
    max: 5000,
    autoform: {
      type: 'markdown'
    }
  }
}

let _collection

Legal.collection = function () {
  if (_collection) {
    _collection = getCollection(Legal)
  }
  return _collection
}

Legal.helpers = {}

Legal.helpers.init = function (collection) {
  if (collection) {_collection = collection}
  const configDoc = Legal.collection().findOne()
  if (!configDoc) {
    Legal.collection().insert({
      imprint: 'Imprint',
      privacy: 'Privacy',
      terms: 'Terms',
      contact: 'Contact'
    })
  }
}

Legal.publications = {}

Legal.publications.single = {
  name: 'legal.publications.single',
  isPublic: true,
  schema: {},
  numRequests: 1,
  timeInterval: 250,
  run: onServer(function () {
    return Legal.collection().find({}, { limit: 1 })
  })
}

Legal.methods = {}

Legal.methods.update = {
  name: 'legal.methods.update',
  isPublic: true, // FIXME only backend editors and admins
  numRequests: 1,
  timeInterval: 250,
  schema: {
    _id: String,
    imprint: Legal.schema.imprint,
    privacy: Legal.schema.privacy,
    terms: Legal.schema.terms,
    contact: Legal.schema.contact
  },
  run: onServer(function ({ _id, imprint, privacy, terms, contact }) {
    return Legal.collection().update(_id, { $set: { imprint, privacy, terms, contact } })
  })
}

Legal.methods.get = {
  name: 'legal.methods.get',
  isPublic: true,
  numRequests: 1,
  timeInterval: 250,
  schema: {
    name: {
      type: String,
      optional: true,
      allowedValues: Object.keys(Legal.schema)
    }
  },
  run: onServer(function ({ name } = {}) {
    const config = Legal.collection().findOne()
    if (!name) {
      return config
    } else {
      return config[name]
    }
  }),
  call: onClient(function (name, cb) {
    Meteor.call(Legal.methods.get.name, {name}, cb)
  })
}