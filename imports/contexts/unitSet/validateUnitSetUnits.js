import { Meteor } from 'meteor/meteor'

export const validateUnitSetUnits = function validateUnits (units) {
  if (!units || units.length === 0) {
    throw new Meteor.Error('unitSet.error', 'unitSet.noUnits')
  }

  return units
}
