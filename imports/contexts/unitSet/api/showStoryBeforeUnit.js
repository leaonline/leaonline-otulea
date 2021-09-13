import { Unit } from '../../Unit'
import { createDocumentList } from '../../../api/lists/createDocumentList'

export const showStoryBeforeUnit = (unitId, unitSetDoc) => {
  if (!unitSetDoc || !unitSetDoc.units?.length) {
    throw new Error('Expected valid unitSet doc, got none or invalid doc')
  }

  if (!unitSetDoc.story?.length) {
    return false
  }

  return createDocumentList({
    currentId: unitId,
    document: unitSetDoc,
    context: Unit,
    fieldName: 'units'
  }).isFirst()
}
