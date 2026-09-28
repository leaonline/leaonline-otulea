/* eslint-env mocha */
import { Meteor } from 'meteor/meteor'

describe('infrastructure', () => {
  require('../../imports/infrastructure/collections/tests')
  require('./mixins')
  require('./factories')
  require('../../imports/infrastructure/csp/cspOptions.tests')
  require('../../imports/infrastructure/env/Env.tests')
  require('../../imports/infrastructure/methods/callMethod.tests')

  if (Meteor.isServer) {
    require('../../imports/infrastructure/crypto/createFixedHMAC.tests')
  }
})
