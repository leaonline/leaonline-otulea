/* eslint-env mocha */
import { Meteor } from 'meteor/meteor'
import { Response } from '../Response'

if (Meteor.isClient) {
  describe(Response.name, function () {
    import './submitResponse.tests'
  })
}
