import { Response } from '../../../../contexts/response/Response'
import { callMethod } from '../../../../infrastructure/methods/callMethod'
import { Unit } from '../../../../contexts/Unit'
import { loadAllContentDocs } from '../../../loading/loadAllContentDocs'

export const createResponsesLoader = ({
  methodCall = callMethod,
  loadAll = loadAllContentDocs,
  responseContext = Response,
  unitContext = Unit,
} = {}) => {
  return async ({ sessionId, debug = () => {} }) => {
    const responses = await methodCall({
      name: responseContext.methods.getMy,
      args: { sessionId },
    })
    if (!Array.isArray(responses)) {
      throw new Error('Expected responses array')
    }
    debug({ responses })

    const ids = Array.from(new Set(responses.map(({ unitId }) => unitId)))
    await loadAll({ context: unitContext, ids, params: { ids }, debug })

    return responses
      .map((document) => ({
        ...document,
        unit: unitContext.collection().findOne(document.unitId) || {
          shortCode: '?',
        },
      }))
      .sort((a, b) => a.unit.shortCode.localeCompare(b.unit.shortCode))
  }
}

export const loadResponses = createResponsesLoader()
