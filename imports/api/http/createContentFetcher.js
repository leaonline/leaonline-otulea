import { noop } from '../../utils/noop'

/**
 * Creates a self-contained object with a fetcher method, that not only
 * fetches docs from content server routes but also implements a caching
 * strategy internally.
 *
 * @param context {object} the content ctx to fetch from
 * @param context.name {string} the name of the context to get the collection
 * @param debug {function=} optional debug function
 * @return {{url: string, cache: Map<String, Object>, fetcher: (function(*): Promise<Map<any, any>>)}}
 */
export const createContentFetcher = ({ context, debug = noop }) => {
  let requested = 0
  let loaded = 0
  let cached = 0

  const api = {
    cache: new Map(),
    fetcher: async (ids) => {
      const collection = context.collection()

      if (!collection) {
        throw new Error(`Collection for ${context.name} not found`)
      }

      const docMap = new Map()
      const toLoad = []

      ids.forEach((id) => {
        if (api.cache.has(id)) {
          docMap.set(id, { ...api.cache.get(id) })
        } else {
          toLoad.push(id)
        }
      })

      if (docMap.size === ids.length) {
        debug(`[fetcher][${context.name}]: skipped request completely`)
        return docMap
      }

      const fetchedDocs = await collection
        .find({ _id: { $in: toLoad } })
        .fetchAsync()
      fetchedDocs.forEach((doc) => {
        docMap.set(doc._id, doc)
        api.cache.set(doc._id, doc)
      })

      requested = ids.length
      loaded = toLoad.length
      cached = fetchedDocs.length
      debug(`[fetcher][${context.name}]:`, {
        requested,
        loaded,
        cached,
        size: api.cache.size,
      })

      return docMap
    },
  }

  return api
}
