/* eslint-env mocha */
import { Meteor } from 'meteor/meteor'
import { Errors } from '../Errors'

if (Meteor.isServer) {
  describe(Errors.name, function () {
    import './normalizeError.tests'
    import './persistError.tests'
    import './crud.tests'
  })
}
