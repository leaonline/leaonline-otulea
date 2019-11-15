import { Meteor } from 'meteor/meteor'
import { Role } from '../accounts/Role'
import { Group } from '../accounts/Group'
import { onServer } from '../../utils/archUtils'
import { getCollection } from '../../utils/collectionuUtils'

export const ErrorLog = {
  name: 'errorLog',
  label: 'errorLog.title',
  icon: 'ban'
}

ErrorLog.schema = {
  userId: String,
  createdAt: Date,
  error: String,
  reason: {
    type: String,
    optional: true
  },
  details: {
    type: String,
    optional: true
  },
  stack: {
    type: String,
    optional: true
  }
}

let _ErrorLogCollection

ErrorLog.collection = function () {
  if (_ErrorLogCollection) {
    _ErrorLogCollection = getCollection(ErrorLog)
  }
  return _ErrorLogCollection
}

ErrorLog.methods = {}

ErrorLog.methods.send = {
  name: 'errorLog.methods.send',
  schema: ErrorLog.schema,
  roles: [Role.runSession.value, Role.test.value],
  group: Group.field.value,
  numRequests: 10,
  timeInterval: 500,
  run: onServer(function ({ error, reason, details, stack }) {
    const { userId } = this
    const createdAt = new Date()
    return ErrorLog.collection().insert({ error, reason, details, stack, userId, createdAt })
  }),
  /**
   * This method is available on server, as well as client.
   */

  call: function ({ error, reason, details, stack }, cb) {
    Meteor.call({ error, reason, details, stack }, cb)
  }
}
