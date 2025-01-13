import { Session } from '../Session'

/**
 * Returns the current user's session doc by id
 * @param sessionId {string} document _id
 * @param userId {string} user _id
 * @return {object|undefined}
 */
export const getSessionDoc = async ({ sessionId, userId }) => {
  return Session.collection().findOneAsync({
    _id: sessionId,
    userId: userId
  })
}
