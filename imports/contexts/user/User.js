import { Meteor } from 'meteor/meteor'
import { Accounts } from 'meteor/accounts-base'
import { regExSchema } from '../../api/schema/regExSchema'
import { onClient, onServer, onServerExec } from '../../utils/archUtils'

export const Users = {
  name: 'users',
  label: 'users.title',
  icon: 'users'
}

Users.schema = {
  /**
   * Users can be created by editors and teachers for testing purposes, so
   * this field is an optional indicator for test or demo users.
   */
  createdBy: {
    type: String,
    optional: true,
    display: 'user'
  },
  createdAt: Date,
  updatedAt: Date,
  username: String,
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
      regEx: regExSchema.idOfLength(5)
    }
  },
  isPublic: true,
  numRequests: 1,
  timeInterval: 1000,
  run: onServer(function ({ code }) {
    return Accounts.createUser({ username: code, password: code })
  }),
  /**
   * @deprecated replace with callMethod function
   */
  call: onClient(function ({ code }, cb) {
    Meteor.call(Users.methods.register.name, { code }, cb)
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

Users.publications = {}

Users.publications.all = {
  name: 'users.publications.all',
  schema: {},
  run: onServer(function () {
    const user = Meteor.users.findOne(this.userId)
    if (!user || !user.services || !user.services.lea) {
      return this.ready()
    }

    const cursor = Meteor.users.find({}, {
      fields: {
        services: 0
      }
    })
    console.info('users sub', cursor.count())
    return cursor
  })
}
