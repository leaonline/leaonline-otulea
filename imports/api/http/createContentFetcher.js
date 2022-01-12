import { toContentServerURL } from '../url/toContentServerURL'
import { fetchDoc } from './fetchDoc'

/**
 * Creates a self-contained object with a fetcher method, that not only
 * fetches docs from content server routes but also implements a caching
 * strategy internally.
 *
 * @param path {String} the oath to a content server get or getAll route.
 * @return {{url: string, cache: Map<String, Object>, fetcher: (function(*): Map<any, any>)}}
 */
export const createContentFetcher = ({ path }) => {
  let requested = 0
  let loaded = 0
  let cached = 0

  const api = {
    url: toContentServerURL(path),
    cache: new Map(),
    fetcher: ids => {
      const docMap = new Map()
      const toLoad = []

      ids.forEach(id => {
        if (api.cache.has(id)) {
          docMap.set(id, { ...api.cache.get(id) })
        }
        else {
          toLoad.push(id)
        }
      })

      if (docMap.size === ids.length) {
        console.debug('[fetcher]: skipped request completely')
        return docMap
      }

      const fetchedDocs = fetchDoc(api.url, { ids: toLoad }) || []
      fetchedDocs.forEach(doc => {
        docMap.set(doc._id, doc)
        api.cache.set(doc._id, doc)
      })

      requested = ids.length
      loaded = toLoad.length
      cached = fetchedDocs.length
      console.debug('[fetcher]:', { requested, loaded, cached, size: api.cache.size })

      return docMap
    }
  }

  return api
}
