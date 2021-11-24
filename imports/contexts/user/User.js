import { Meteor } from 'meteor/meteor'
import { Accounts } from 'meteor/accounts-base'
import { onServer, onServerExec } from '../../utils/archUtils'

const settings = Meteor.settings.public.accounts
const codeLength = settings.code.length
const defaultMaxRetries = settings.code.maxRetries

export const Users = {
  name: 'users',
  label: 'users.title',
  icon: 'users',
  representative: 'username'
}

Users.schema = {
  username: {
    type: String,
    min: codeLength,
    max: codeLength
  },
  updatedAt: {
    type: Date,
    sort: -1
  },

  createdAt: Date,

  /**
   * Some users are generated only for demonstration purposes, we should
   * flag them, so we can distinguish them from real users
   */
  isDemoUser: {
    type: Boolean,
    optional: true
  },

  /**
   * The debug flag can be used to make the app show extended data that should
   * not be visible to default users.
   */
  debug: {
    type: Boolean,
    optional: true
  },

  /**
   * In case this user is created by a specific routing or backend, we want
   * to provide the option to leave a comment, so we can associate this user
   * later.
   */
  comment: {
    type: String,
    optional: true
  },

  /**
   * Is users of the app willingly want to connect their email to restore
   * passwords we can help with that
   */
  email: {
    type: String,
    optional: true
  },
  services: {
    type: Object,
    blackbox: true // TODO specify
  },

  /**
   * We need to get better insight of the various user agents
   */
  agents: {
    type: Array,
    optional: true
  },
  'agents.$': Object,
  'agents.$.name': String,
  'agents.$.screenWidth': Number,
  'agents.$.screenHeight': Number,
  'agents.$.viewPortWidth': Number,
  'agents.$.viewPortHeight': Number
}

Users.methods = {}

Users.methods.generate = {
  name: 'users.methods.generate',
  schema: {
    isDemo: {
      type: Boolean,
      optional: true
    }
  },
  backend: true,
  numRequests: 1,
  timeInterval: 1000,
  run: onServerExec(function () {
    import { generateUserCode } from '../../api/accounts/generateUserCode'

    return function ({ isDemo } = {}) {
      const usersLength = Meteor.users.find().count()
      const maxRetries = usersLength > defaultMaxRetries
        ? usersLength
        : defaultMaxRetries

      const code = generateUserCode(codeLength, maxRetries)
      const userId = Accounts.createUser({ username: code, password: code })

      if (isDemo === true) {
        Meteor.users.update(userId, { $set: { isDemoUser: isDemo } })
      }

      return Meteor.users.findOne(userId, { fields: { services: 0 } })
    }
  })
}

Users.methods.generateCode = {
  name: 'users.methods.generateCode',
  schema: {},
  isPublic: true,
  numRequests: 1,
  timeInterval: 5000,
  run: onServerExec(function () {
    import { generateUserCode } from '../../api/accounts/generateUserCode'

    return function () {
      const { userId } = this

      if (userId) {
        throw new Meteor.Error('generateCode.error', 'generateCode.alreadyLoggedIn', { userId })
      }

      const usersLength = Meteor.users.find().count()
      const maxRetries = usersLength > defaultMaxRetries
        ? usersLength
        : defaultMaxRetries

      return generateUserCode(codeLength, maxRetries)
    }
  })
}

Users.methods.register = {
  name: 'users.methods.register',
  schema: {
    code: {
      type: String,
      min: codeLength,
      max: codeLength
    },
    isDemoUser: {
      type: Boolean,
      optional: true
    }
  },
  isPublic: true,
  numRequests: 1,
  timeInterval: 1000,
  run: onServer(function ({ code, isDemoUser }) {
    const userId = Accounts.createUser({ username: code, password: code })

    if (isDemoUser === true) {
      Meteor.users.update(userId, { $set: { isDemoUser } })
    }

    return userId
  })
}

Users.methods.isDebug = {
  name: 'users.methods.isDebug',
  schema: {
    value: Boolean
  },
  numRequests: 1,
  timeInterval: 1000,
  run: onServer(function ({ value }) {
    const { userId } = this
    return Meteor.users.update(userId, {
      $set: { debug: value }
    })
  })
}

Users.methods.exist = {
  name: 'user.methods.exist',
  backend: true,
  numRequests: 1,
  timeInterval: 1000,
  schema: {
    code: String
  },
  run: onServer(function ({ code }) {
    return Meteor.users.findOne({ username: code })
  })
}

Users.methods.loggedIn = {
  name: 'user.methods.loggedIn',
  schema: {
    screenWidth: Number,
    screenHeight: Number,
    viewPortWidth: Number,
    viewPortHeight: Number
  },
  numRequests: 1,
  timeInterval: 1000,
  run: onServerExec(function () {
    import { SHA256 } from 'meteor/sha'

    return function ({ screenWidth, screenHeight, viewPortWidth, viewPortHeight }) {
      // eslint-disable-next-line
      const { userId } = this
      const { connection } = this
      const origin = SHA256(connection.clientAddress)
      const name = connection.httpHeaders['user-agent']
      const updateDoc = {
        origin,
        name,
        screenWidth,
        screenHeight,
        viewPortWidth,
        viewPortHeight
      }
      const updatedAt = new Date()
      return Meteor.users.update(userId, {
        $set: { updatedAt },
        $addToSet: { agents: updateDoc }
      })
    }
  })
}

onServerExec(function () {
  Users.actions = {
    generateUser: {
      key: 'generateUser',
      label: 'users.generate',
      icon: 'plus',
      name: Users.methods.generate.name,
      isAll: true,
      color: 'success',
      args: {
        isDemo: Boolean,
        isDebug: Boolean
      }
    }
  }
})

/**
 * No publications for now
 * @private
 */
Users.publications = {}
