import { onServerExec } from '../../utils/archUtils'

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
  run: onServerExec(function () {
    import { getError } from './api/getError'
    return function ({ _id }) {
      return getError(_id)
    }
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
  run: onServerExec(function () {
    import { getAllErrors } from './api/getAllErrors'

    return function ({ ids }) {
      return getAllErrors(ids)
    }
  })
}

Errors.methods.remove = {
  name: 'errors.methods.remove',
  schema: {
    _id: String
  },
  backend: true,
  run: onServerExec(function () {
    import { removeError } from './api/removeError'

    return function ({ _id }) {
      return removeError({ _id })
    }
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
