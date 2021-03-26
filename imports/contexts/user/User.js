import { Meteor } from 'meteor/meteor'
import { Accounts } from 'meteor/accounts-base'
import { onClient, onServer, onServerExec } from '../../utils/archUtils'

export const Users = {
  name: 'users',
  label: 'users.title',
  icon: 'users',
  representative: 'username'
}

Users.schema = {
  username: String,
  isDemoUser: {
    type: Boolean,
    optional: true
  },
  debug: {
    type: Boolean,
    optional: true
  },
  createdAt: Date,
  updatedAt: Date,

  email: {
    type: String,
    optional: true
  },
  services: {
    type: Object,
    blackbox: true // TODO specify
  },
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

Users.methods.register = {
  name: 'user.methods.register',
  schema: {
    code: {
      type: String,
      min: 5,
      max: 5
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
  }),
  /**
   * @deprecated replace with callMethod function
   */
  call: onClient(function ({ code, isDemoUser }, cb) {
    Meteor.call(Users.methods.register.name, { code, isDemoUser }, cb)
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
  }),
  /**
   * @deprecated replace with callMethod function
   */
  call: onClient(function ({ screenWidth, screenHeight, viewPortWidth, viewPortHeight }, cb) {
    Meteor.call(Users.methods.loggedIn.name, {
      screenWidth,
      screenHeight,
      viewPortWidth,
      viewPortHeight
    }, cb)
  })
}

Users.methods.recent = {
  name: 'user.methods.recent',
  schema: {},
  numRequests: 1,
  timeInterval: 1000,
  run: onServer(function () {
    return Meteor.users.find({}, {
      limit: 100,
      fields: {
        email: 0,
        roles: 0,
        services: 0
      },
      hint: { $natural: -1 }
    }).fetch()
  })
}

// /////////////////////////////////////////////////////////////////////////////
//
//  BACKEND ONLY
//
// /////////////////////////////////////////////////////////////////////////////
Users.methods.getAll = {
  name: 'users.methods.getAll',
  schema: {
    dependencies: {
      type: Array,
      optional: true
    },
    'dependencies.$': {
      type: Object,
      blackbox: true,
      optional: true
    }
  },
  backend: true,
  run: onServer(function () {
    const users = Meteor.users.find({}, {
      fields: {
        services: 0,
        agents: 0
      },
      hint: {
        $natural: -1
      }
    }).fetch()

    return { users }
  })
}

Users.methods.remove = {
  name: 'users.methods.remove',
  schema: {
    _id: 1
  },
  backend: true,
  run: onServerExec(function () {
    import { removeUser } from '../../api/accounts/removeUser'

    return function ({ _id }) {
      return removeUser(_id, this.userId)
    }
  })
}

/**
 * No publications for now
 * @private
 */
Users.publications = {}
