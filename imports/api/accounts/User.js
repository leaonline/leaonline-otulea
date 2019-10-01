/* global Accounts Meteor */
import { check } from 'meteor/check'
import { onClient, onServer } from '../../utils/archUtils'
import { Role } from './Role'
import { Group } from './Group'

export const Users = {
  name: 'users',
  label: 'users.title',
  icon: 'users',
  methods: {},
  publications: {}
}

Users.schema = {
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
  'agents.$.viewPortHeight': Number,

}

Users.methods.register = {
  name: 'user.methods.register',
  schema: {
    code: String
  },
  isPublic: true,
  numRequests: 1,
  timeInterval: 1000,
  run: onServer(function ({ code }) {
    check(code, String)
    const userId = Accounts.createUser({ username: code, password: code })
    Roles.addUsersToRoles(userId, [ Role.runSession.value ], Group.field.value)
    return userId
  }),
  call: onClient(function ({ code }, cb) {
    Meteor.call(Users.methods.register.name, { code }, cb)
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
  roles: [ Role.runSession.value, Role.test.value ],
  group: Group.field.value,
  numRequests: 1,
  timeInterval: 1000,
  run: onServer(function ({ screenWidth, screenHeight, viewPortWidth, viewPortHeight }) {
    import { SHA256 } from 'meteor/sha'
    const { userId } = this
    const { connection } = this
    const origin = SHA256(connection.clientAddress)
    const name = connection.httpHeaders[ 'user-agent' ]
    const updateDoc = { origin, name, screenWidth, screenHeight, viewPortWidth, viewPortHeight }
    const updatedAt = new Date()
    return Meteor.users.update(userId, { $set: { updatedAt }, $addToSet: { agents: updateDoc } })
  }),
  call: onClient(function ({ screenWidth, screenHeight, viewPortWidth, viewPortHeight }, cb) {
    Meteor.call(Users.methods.loggedIn.name, { screenWidth, screenHeight, viewPortWidth, viewPortHeight }, cb)
  })
}

Users.methods.recent = {
  name: 'user.methods.recent',
  schema: {},
//  roles: [ Role.runSession.value, Role.test.value ],
//  group: Group.field.value,
  numRequests: 1,
  timeInterval: 1000,
  isPublic: true,
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