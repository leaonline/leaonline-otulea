import { Meteor } from 'meteor/meteor'

export class LeaError extends Meteor.Error {
  constructor (error, reason, details) {
    super(error, reason, details)
  }
}
