/**
 * Creates an item input that stores it into a given cache.
 * @param cache
 * @return {onItemInput}
 */
export const createItemInput = ({ cache }) => {
  /**
   * Handler for scoring item inputs
   * @param userId
   * @param sessionId
   * @param unitId
   * @param page
   * @param type
   * @param responses
   */
  return function onItemInput ({ userId, sessionId, unitId, page, type, contentId, responses }) {
    cache.save({
      userId,
      sessionId,
      unitId,
      page,
      type,
      contentId,
      responses
    })
  }
}
