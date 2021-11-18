import { toContentServerURL } from '../../api/url/toContentServerURL'
import { isPlainObject } from '../../utils/object/isPlainObject'
import { asyncHTTP } from './asyncHTTP'

/**
 * Loads a single document from the content-server
 * @param context {Object} The context related to the document.
 * @param docId {String} The _id value of the document
 * @param debug {Function?} optional debug logger
 * @return {Promise<Object>} A promise resoling to an object or void
 */

export const loadContentDoc = async (context, docId, debug = () => {}) => {
  const collection = context.collection()
  const cursor = collection.find(docId)

  if (cursor.count() > 0) {
    return cursor.fetch()[0]
  }

  const route = context.routes.byId
  const url = toContentServerURL(route.path)

  const method = route.method.toUpperCase()
  const requestOptions = {}
  requestOptions.params = { _id: docId }
  requestOptions.headers = {
    mode: 'cors',
    cache: 'no-store'
  }

  debug('load', method, url, docId)

  const response = await asyncHTTP(method, url, requestOptions)
  const document = response.data

  if (!isPlainObject(document)) {
    throw new Error(`Expected document for ${method} ${url}`)
  }

  debug('received', document._id)
  collection.upsert({ _id: docId }, { $set: document })
  return collection.findOne(docId)
}
