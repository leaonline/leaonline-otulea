import { Meteor } from 'meteor/meteor'
import { validateUnitSetDoc } from './validateUnitSetDoc'
import { validateUnitSetUnits } from './validateUnitSetUnits'

export const getValidatedUnitIndex = (unitId, unitSetDoc) => {
  validateUnitSetDoc(unitSetDoc)
  validateUnitSetUnits(unitSetDoc.units)

  const index = unitSetDoc.units.indexOf(unitId)
  if (index === -1) {
    throw new Meteor.Error('unitSet.error', 'unitSet.unitNotInSet', {
      unitId,
      unitSet: unitSetDoc._id
    })
  }

  return index
}
