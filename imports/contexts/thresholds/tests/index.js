/* eslint-env mocha */
import { Meteor } from 'meteor/meteor'
import { Thresholds } from '../Thresholds'

if (Meteor.isServer) {
  describe(Thresholds.name, () => {
    require('./getGrade.tests')
    require('./getThresholds.tests')
  })
}
