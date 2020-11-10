import { Meteor } from 'meteor/meteor'

export const checkPermissions = function (options) {
  const exception = options.isPublic
  if (exception) return options

  const runFct = options.run
  options.run = function run (...args) {
    // user level permission
    let userId = this.userId
    if (!userId) {
      const user = Meteor.user()
      userId = user && userId._id
    }

    if (!userId || !Meteor.users.findOne(userId)) {
      throw new Meteor.Error('errors.permissionDenied', 'errors.userNotExists', userId)
    }

    return runFct.call(this, ...args)
  }

  return options
}
