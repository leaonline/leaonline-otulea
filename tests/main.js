/* eslint-env mocha */
import { Meteor } from 'meteor/meteor'

if (Meteor.isServer) {
  (function () {
    import './infrastructure'
    import './api'
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
