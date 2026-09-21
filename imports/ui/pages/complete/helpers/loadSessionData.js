import { createSessionLoader } from '../../../loading/createSessionLoader'
import { sessionIsComplete } from '../../../../contexts/session/utils/sessionIsComplete'

export const createSessionDataLoader = ({
  createLoader = createSessionLoader,
  isComplete = sessionIsComplete,
} = {}) => {
  return async ({ debug = () => {}, sessionId }) => {
    const sessionLoader = createLoader({ debug })
    const sessionData = await sessionLoader({ sessionId })
    debug('loaded session data', sessionData)
    if (!sessionData) return undefined

    const { sessionDoc, unitSetDoc, dimensionDoc, levelDoc, color } = sessionData
    if (!sessionDoc || !unitSetDoc || !dimensionDoc || !levelDoc) {
      return undefined
    }
    if (!isComplete(sessionDoc)) return { action: 'exit', sessionId }

    return {
      sessionDoc,
      dimensionDoc,
      levelDoc,
      unitSetDoc,
      color,
      sessionLoaded: true,
    }
  }
}

export const loadSessionData = createSessionDataLoader()
