import { Meteor } from 'meteor/meteor'
import { onServer } from '../../utils/archUtils'

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

ErrorLog.methods = {}

ErrorLog.methods.send = {
  name: 'errorLog.methods.send',
  schema: ErrorLog.schema,
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
