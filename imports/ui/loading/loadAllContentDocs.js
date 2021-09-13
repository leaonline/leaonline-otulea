import { toContentServerURL } from '../../api/url/toContentServerURL'
import { HTTP } from 'meteor/jkuester:http'

/**
 * Loads all docs from the content-server by given params.
 * @param context {Object} The context the objects belong to
 * @param params {Object?} optional additional parameters
 * @param debug {Function?} optional debug logger
 * @return {Promise}
 */
export const loadAllContentDocs = (context, params, debug = () => {}) => {
  const route = context.routes.all
  const collection = context.collection()
  const url = toContentServerURL(route.path)
  const method = route.method.toUpperCase()
  const requestOptions = {}
  requestOptions.headers = {
    mode: 'cors',
    cache: 'no-store'
  }

  if (params) {
    requestOptions.params = params
  }

  debug(method, url, 'start request')
  debug(method, url, 'request options', requestOptions)

  return new Promise((resolve, reject) => {
    HTTP.call(method, url, requestOptions, (error, response) => {
      debug(method, url, 'response received', { error, response })
      if (error) {
        debug(method, url, 'failed')
        return reject(error)
      }

      let documents

      if (Array.isArray(response.data)) {
        documents = response.data
      }

      else if (response.data) {
        documents = [response.data]
      }

      else {
        documents = []
      }

      // skip further processing if no documents have been received
      if (documents.length === 0) {
        debug(method, url, 'failed (no docs received)')
        return resolve(documents)
      }

      debug(method, url, `received ${documents.length} doc(s)`)
      documents.forEach(doc => collection.upsert(doc._id, { $set: doc }))
      resolve(documents)
    })
  })
}
