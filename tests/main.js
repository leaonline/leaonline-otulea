/* eslint-env mocha */
import { Meteor } from 'meteor/meteor'
import 'meteor/aldeed:collection2/static'

if (Meteor.isAppTest) {
  require('../imports/integration/appFlow.app-tests')
} else {
  if (Meteor.isServer) {
    ;(() => {
      require('./webapp-server-helpers')
      require('./infrastructure')
      require('./api')
      require('./startup')
    })()
  }

  if (Meteor.isClient) {
    ;(() => {
      require('./client')
      require('./api')
    })()
  }

  describe('common', () => {
    require('./utils')
    require('./contexts')
  })
}
