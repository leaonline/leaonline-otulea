/* eslint-env mocha */
import { Meteor } from 'meteor/meteor'

describe('contexts', function () {
  import '../../imports/contexts/errors/tests'
  import '../../imports/contexts/response/tests'
  import '../../imports/contexts/session/tests'
  import '../../imports/contexts/unitSet/tests'
  import '../../imports/contexts/thresholds/tests'
  import '../../imports/contexts/feedback/tests'
  import '../../imports/contexts/record/tests'
  import '../../imports/contexts/tests/definitions.tests'
  import '../../imports/contexts/tests/Unit.tests'
  if (Meteor.isServer) {
    require('../../imports/contexts/user/tests')
  }
})
