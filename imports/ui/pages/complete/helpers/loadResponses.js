import { Response } from '../../../../contexts/response/Response'
import { callMethod } from '../../../../infrastructure/methods/callMethod'
import { Unit } from '../../../../contexts/Unit'

export const loadResponses = async ({ sessionId, debug }) => {
  const responses = await callMethod({
    name: Response.methods.getMy,
    args: { sessionId },
  })
  debug({ responses })

  const unitIds = new Set()
  responses.forEach((doc) => unitIds.add(doc.unitId))

  const ids = Array.from(unitIds)
  await loadAllContentDocs({ context: Unit, ids, params: { ids }, debug })
  const mapped = responses.map((doc) => {
    doc.unit = Unit.collection().findOne(doc.unitId) || { shortCode: '?' }
    return doc
  })

  responses.sort((a, b) => a.unit.shortCode.localeCompare(b.unit.shortCode))
  return mapped
}
