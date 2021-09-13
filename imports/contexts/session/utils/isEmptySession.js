import { Response } from '../../response/Response'

const hasResponses = sessionId => Response.collection().find({ sessionId }).count() > 0

/**
 * Defines, whether a session can be safely removed.
 * @param sessionDoc
 * @return {boolean}
 */
export const isEmptySession = sessionDoc => !sessionDoc.progress && !hasResponses(sessionDoc._id)
