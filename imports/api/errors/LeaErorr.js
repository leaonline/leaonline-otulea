import { Meteor } from 'meteor/meteor'
import { ErrorLog } from './ErrorLog'

export class LeaError extends Meteor.Error {
  constructor (error, reason, details) {
    super(error, reason, details)
    ErrorLog.methods.send.call(this)
  }
}
