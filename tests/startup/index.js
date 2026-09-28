/* eslint-env mocha */
import { Meteor } from 'meteor/meteor'

describe('startup', () => {
  require('../../imports/patches/tests')
  if (Meteor.isServer) {
    require('../../imports/startup/server/startupWiring.tests')
  }
})
