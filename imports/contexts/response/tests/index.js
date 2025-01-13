/* eslint-env mocha */
import { Meteor } from 'meteor/meteor'
import { Response } from '../Response'

if (Meteor.isServer) {
  describe(Response.name, function () {
    import './submitResponse.tests'
  })
}
