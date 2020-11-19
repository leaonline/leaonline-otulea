import { getValidatedUnitIndex } from './getValidatedUnitIndex'

export const getNextUnitInSet = (unitId, unitSetDoc) => {
  const index = getValidatedUnitIndex(unitId, unitSetDoc)
  if (index === unitSetDoc.units.length - 1) {
    return null
  }

  return unitSetDoc.units[index + 1]
}
