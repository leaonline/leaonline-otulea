import { Meteor } from 'meteor/meteor'

export class NotImplementedError extends Meteor.Error {
  static get TITLE () {
    return 'errors.notImplemented.title'
  }

  constructor () {
    super(NotImplementedError.TITLE)
  }
}
