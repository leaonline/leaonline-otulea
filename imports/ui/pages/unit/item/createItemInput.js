/**
 * Creates an item input that stores it into a given cache.
 * @param cache
 * @return {onItemInput}
 */
export const createItemInput = ({ cache, debug = () => {} }) => {
  return function onItemInput ({ userId, sessionId, unitId, page, type, contentId, responses }) {
    debug('save item data', { userId, sessionId, unitId, page, type, contentId, responses })
    return cache.save({
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
