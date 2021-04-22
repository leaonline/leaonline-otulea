import { onServer, onServerExec } from '../../utils/archUtils'

export const Errors = {
  name: 'errors',
  label: 'errors.title',
  icon: 'exclamation-mark'
}

Errors.schema = {
  name: {
    type: String
  },

  type: {
    type: String
  },

  message: {
    type: String
  },

  details: {
    type: String,
    optional: true
  },

  hash: {
    type: String
  },

  count: {
    type: Number,
    optional: true
  },

  stack: {
    type: String
  },

  createdBy: {
    type: String
  },

  createdAt: {
    type: Date
  },

  template: {
    type: String,
    optional: true
  },

  isServer: Boolean,
  isClient: Boolean,
  method: {
    type: String,
    optional: true
  },
  publication: {
    type: String,
    optional: true
  },
  endpoint: {
    type: String,
    optional: true
  },
  isSystem: Boolean,

  browser: {
    type: String,
    optional: true
  }
}

Errors.publications = {}
Errors.routes = {}
Errors.methods = {}

Errors.methods.get = {
  name: 'errors.methods.get',
  schema: {
    _id: String
  },
  backend: true,
  run: onServer(function ({ _id }) {
    return Errors.collection().findOne({ _id })
  })
}

Errors.methods.getAll = {
  name: 'errors.methods.getAll',
  schema: {
    ids: {
      type: Array,
      optional: true
    },
    'ids.$': String,
    dependencies: {
      type: Array,
      optional: true
    },
    'dependencies.$': String
  },
  backend: true,
  run: onServer(function ({ ids }) {
    const query = {}
    if (ids) query._id = { $in: ids }
    const transform = {
      hint: { $natural: -1 }
    }
    return Errors.collection().find(query, transform).fetch()
  })
}

Errors.methods.remove = {
  name: 'errors.methods.remove',
  schema: {
    _id: String
  },
  backend: true,
  run: onServer(function ({ _id }) {
    return Errors.collection().remove({ _id })
  })
}

Errors.methods.create = {
  name: 'errors.methods.create',
  schema: Errors.schema,
  run: onServerExec(function () {
    import { persistError } from './api/persistError'

    return function (errorDoc) {
      return persistError(errorDoc)
    }
  })
}
