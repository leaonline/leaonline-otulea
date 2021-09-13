/**
 * Revives an item state from response cache. The returned function is to be
 * passed to the renderer / rendererfactory.
 *
 * @param cache The cache used to load the item from
 * @return {function({sessionId: *, unitId: *, page: *, contentId: *}): *}
 */
export const createItemLoad = ({ cache, debug = () => {} }) => {
  return function onItemLoad ({ sessionId, unitId, page, contentId }) {
    debug('load item data', { sessionId, unitId, page, contentId })
    const entry = cache.load({ sessionId, unitId, page, contentId })
    debug('entry found?', entry)
    return entry
  }
}
