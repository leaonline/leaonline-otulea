import { Meteor } from 'meteor/meteor'

// COMMON / SHARED
import './utils'

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
