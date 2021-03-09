import { getValidatedUnitIndex } from './getValidatedUnitIndex'

export const isFirstUnit = (unitId, unitSetDoc) => getValidatedUnitIndex(unitId, unitSetDoc) === 0
