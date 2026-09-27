/* eslint-env mocha */
import { Meteor } from 'meteor/meteor'

describe('contexts', () => {
  require('../../imports/contexts/errors/tests')
  require('../../imports/contexts/response/tests')
  require('../../imports/contexts/session/tests')
  require('../../imports/contexts/unitSet/tests')
  require('../../imports/contexts/thresholds/tests')
  require('../../imports/contexts/feedback/tests')
  require('../../imports/contexts/record/tests')
  require('../../imports/contexts/tests/definitions.tests')
  require('../../imports/contexts/tests/Unit.tests')
  if (Meteor.isServer) {
    require('../../imports/contexts/user/tests')
  }
})
