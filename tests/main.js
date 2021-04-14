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
