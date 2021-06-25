/* eslint-env mocha */
import { Meteor } from 'meteor/meteor'

describe('factories', function () {
  import '../../imports/infrastructure/factories/collection/createCollection.tests'

  if (Meteor.isServer) {
    // import server-only factories
  }
})
