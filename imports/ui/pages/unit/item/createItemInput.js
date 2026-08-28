import { noop } from '../../../../utils/noop'

/**
 * Creates an item input that stores it into a given cache.
 * @param cache {ResponseCache}
 * @param debug {function}
 * @return {onItemInput}
 */
export const createItemInput = ({ cache, debug = noop }) => {
  return ({ userId, sessionId, unitId, page, type, contentId, responses }) => {
    debug('cache item data from', { userId, sessionId, unitId, page, type, contentId, responses })
    const {key, value} = cache.save({
      userId,
      sessionId,
      unitId,
      page,
      type,
      contentId,
      responses
    })
    debug('cache item data => as', key, value)
    return { key, value }
  }
}
