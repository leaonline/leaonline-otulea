/* eslint-env mocha */
import { Meteor } from 'meteor/meteor'

describe('infrastructure', function () {
  import '../../imports/infrastructure/collections/tests'
  import './mixins'
  import './factories'
  import '../../imports/infrastructure/csp/cspOptions.tests'
  import '../../imports/infrastructure/env/Env.tests'
  import '../../imports/infrastructure/methods/callMethod.tests'

  if (Meteor.isServer) {
    import '../../imports/infrastructure/crypto/createFixedHMAC.tests'
  }
})
