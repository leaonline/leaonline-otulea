/* eslint-env mocha */
import { Meteor } from 'meteor/meteor'

describe('factories', function () {
  import '../../imports/infrastructure/factories/collection/createCollection.tests'

  if (Meteor.isServer) {
    require('../../imports/infrastructure/factories/method/createMethods.tests')
    require('../../imports/infrastructure/factories/publication/createPublication.tests')
    require('../../imports/api/services/createRemoveMethod.tests')
  }
})
