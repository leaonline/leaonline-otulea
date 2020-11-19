import { isFirstUnit } from './isFirstUnit'

export const showStoryBeforeUnit = (unitId, unitSetDoc) => (unitSetDoc?.story?.length > 0) && isFirstUnit(unitId, unitSetDoc)
