import { Session } from '../Session'

/**
 * Returns the current user's session doc by id
 * @param sessionId
 * @param userId
 * @return {any}
 */
export const getSessionDoc = function getSessionDoc ({ sessionId, userId }) {
  return Session.collection().findOne({
    _id: sessionId,
    userId: userId
  })
}
