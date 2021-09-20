import { onServerExec } from '../../utils/archUtils'

export const Errors = {
  name: 'errors',
  label: 'errors.title',
  icon: 'exclamation-triangle'
}

Errors.schema = {
  name: {
    type: String
  },

  type: {
    type: String
  },

  message: {
    type: String,
    optional: true
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
    type: String,
    optional: true
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
  },
  code: {
    type: String,
    optional: true
  }
}

Errors.publications = {}
Errors.routes = {}
Errors.methods = {}

Errors.methods.create = {
  name: 'errors.methods.create',
  schema: Errors.schema,
  isPublic: true,
  run: onServerExec(function () {
    import { persistError } from './api/persistError'

    return function (errorDoc) {
      return persistError(errorDoc)
    }
  })
}
