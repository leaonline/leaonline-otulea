import { toContentServerURL } from '../../api/url/toContentServerURL'
import { createLog } from '../../utils/createInfoLog'
import { HTTP } from 'meteor/jkuester:http'
import { isPlainObject } from '../../utils/object/isPlainObject'

export const loadContentDoc = (context, docId, debug) => {
  return new Promise((resolve, reject) => {
    const cursor = context.collection().find(docId)
    if (cursor.count() > 0) {
      return resolve(cursor.fetch()[0])
    }

    const route = context.routes.byId
    const collection = context.collection()
    const url = toContentServerURL(route.path)
    const info = createLog({
      name: context.name,
      devOnly: true
    })

    const method = route.method.toUpperCase()
    const requestOptions = {}
    requestOptions.params = { _id: docId }
    requestOptions.headers = {
      mode: 'cors',
      cache: 'no-store'
    }

    info('load', method, url, docId)
    HTTP.call(method, url, requestOptions, (error, response) => {
      if (error) {
        info(error)
        return reject(error)
      }

      const document = response.data

      if (!isPlainObject(document)) {
        return reject(document)
      }

      info('received', document._id)

      collection.upsert({ _id: docId }, { $set: document })
      resolve(collection.findOne(docId))
    })
  })
}
