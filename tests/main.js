/* eslint-env mocha */
import { Meteor } from 'meteor/meteor'

if (Meteor.isServer) {
  (function () {
    import './webapp-server-helpers'
    import './infrastructure'
    import './api'
    import './startup'
  })()
}

if (Meteor.isClient) {
  (function () {
    import './client'
  })()
}

describe('common', function () {
  import './utils'
  import './contexts'
})
