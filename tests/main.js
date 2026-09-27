/* eslint-env mocha */
import { Meteor } from 'meteor/meteor'
import 'meteor/aldeed:collection2/static'

if (Meteor.isServer) {
  (function () {
    require('./webapp-server-helpers')
    require('./infrastructure')
      require('./api')
      require('./startup')
  })()
}

if (Meteor.isClient) {
  (function () {
      require('./client')
      require('./api')
  })()
}

describe('common', function () {
    require( './utils')
    require('./contexts')
})
