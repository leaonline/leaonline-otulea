import { getValidatedUnitIndex } from './getValidatedUnitIndex'

export const isLastUnitInSet = (unitId, unitSetDoc) => getValidatedUnitIndex(unitId, unitSetDoc) === unitSetDoc.units.length - 1
