import { toContentServerURL } from '../../api/url/toContentServerURL'
import { HTTP } from 'meteor/jkuester:http'
import { isPlainObject } from '../../utils/object/isPlainObject'

/**
 * Loads a single document from the content-server
 * @param context {Object} The context related to the document.
 * @param docId {String} The _id value of the document
 * @param debug {Function?} optional debug logger
 * @return {Promise<Object>} A promise resoling to an object or void
 */

export const loadContentDoc = (context, docId, debug = () => {}) => {
  return new Promise((resolve, reject) => {
    const cursor = context.collection().find(docId)
    if (cursor.count() > 0) {
      return resolve(cursor.fetch()[0])
    }

    const route = context.routes.byId
    const collection = context.collection()
    const url = toContentServerURL(route.path)

    const method = route.method.toUpperCase()
    const requestOptions = {}
    requestOptions.params = { _id: docId }
    requestOptions.headers = {
      mode: 'cors',
      cache: 'no-store'
    }

    debug('load', method, url, docId)
    HTTP.call(method, url, requestOptions, (error, response) => {
      if (error) {
        debug(error)
        return reject(error)
      }

      const document = response.data

      if (!isPlainObject(document)) {
        return reject(document)
      }

      debug('received', document._id)

      collection.upsert({ _id: docId }, { $set: document })
      resolve(collection.findOne(docId))
    })
  })
}
