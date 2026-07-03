import { createSessionLoader } from '../../../loading/createSessionLoader'
import { sessionIsComplete } from '../../../../contexts/session/utils/sessionIsComplete'

export const loadSessionData = async ({ debug, sessionId }) => {
  // we use the session loader to simply the loading of the session dependencies
  // such as Dimension, Level, UnitSet, Colors, Unit etc.
  const sessionLoader = createSessionLoader({ debug })
  const sessionData = await sessionLoader({ sessionId })
  debug('loaded session data', sessionData)

  if (!sessionData) {
    return
  }

  const { sessionDoc, unitSetDoc, dimensionDoc, levelDoc, color } = sessionData

  // first we check for all docs, even one left-out doc is not acceptable
  if (!sessionDoc || !unitSetDoc || !dimensionDoc || !levelDoc) {
    return // we can safely skip since this information is not viable
  }

  // if we encounter a sessionDoc that is not completed, we just
  // skip any further attempts to load and immediately exit
  if (!sessionIsComplete(sessionDoc)) {
    return { action: 'exit', sessionId }
  }

  // otherwise we're good and can continue with the current session
  return {
    sessionDoc,
    dimensionDoc,
    levelDoc,
    unitSetDoc,
    color,
    sessionLoaded: true
  }
}
