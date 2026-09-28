/* eslint-env mocha */
import { Meteor } from 'meteor/meteor'
import { Errors } from '../Errors'

if (Meteor.isServer) {
  describe(Errors.name, () => {
    require('./normalizeError.tests')
    require('./persistError.tests')
    require('./crud.tests')
  })
}
