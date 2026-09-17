import { Response } from '../../response/Response'

/**
 * Defines, whether a session can be safely removed.
 * @param sessionDoc
 * @return {Promise<Boolean>}
 */
export const isEmptySession = async (sessionDoc) => {
  if (sessionDoc?.progress) return false
  const responses = await Response.collection().countDocuments({
    _id: sessionDoc._id,
  })
  return responses === 0
}
