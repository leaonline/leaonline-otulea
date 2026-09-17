/* eslint-env mocha */
import { Meteor } from 'meteor/meteor'
import { UnitSet } from '../UnitSet'

if (Meteor.isClient) {
  describe(UnitSet.name, () => {
    require('./showStoryBeforeUnit.tests')
    require('./getUnitSetForDimensionAndLevel.tests')
  })
}
