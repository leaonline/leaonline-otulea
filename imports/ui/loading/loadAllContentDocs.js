import { toContentServerURL } from '../../api/url/toContentServerURL'
import { createLog } from '../../utils/createInfoLog'
import { HTTP } from 'meteor/jkuester:http'

export const loadAllContentDocs = (context, params, debug) => {
  const route = context.routes.all
  const collection = context.collection()
  const url = toContentServerURL(route.path)
  const info = createLog({
    name: context.name,
    devOnly: true
  })

  const method = route.method.toUpperCase()
  const requestOptions = {}
  requestOptions.headers = {
    mode: 'cors',
    cache: 'no-store'
  }

  if (params) {
    requestOptions.params = params
  }

  info('start request', method, url)

  if (debug) {
    info('request options', requestOptions)
  }

  return new Promise((resolve, reject) => {
    HTTP.call(method, url, requestOptions, (error, response) => {
      if (error) {
        info(error)
        return reject(error)
      }

      if (debug) info(response)
      const documents = response.data

      if (!Array.isArray(documents)) {
        return reject(documents)
      }

      // skip further processing if no documents have been received
      if (documents.length === 0) {
        info('skip (no docs received)')
        return resolve(documents)
      }

      info(`received ${documents.length} doc(s)`)
      documents.forEach(doc => collection.upsert(doc._id, { $set: doc }))
      resolve(documents)
    })
  })
}
