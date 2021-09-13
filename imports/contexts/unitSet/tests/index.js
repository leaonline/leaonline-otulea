/* eslint-env mocha */
import { Meteor } from 'meteor/meteor'
import { UnitSet } from '../UnitSet'

if (Meteor.isClient) {
  describe(UnitSet.name, function () {
    import './showStoryBeforeUnit.tests'
    import './getUnitSetForDimensionAndLevel.tests'
  })
}
