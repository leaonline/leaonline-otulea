import { HTTP } from 'meteor/jkuester:http'
import { toContentServerURI } from '../../api/loading/toContentServerURI'

const headers = {
  origin: Meteor.absoluteUrl(),
  mode: 'cors',
  cache: 'no-store'
}

export const createContentCache = ({ context, map = new Map() }) => ({
  get: function (docId) {
    if (map.has(docId)) {
      return map.get(docId)
    }

    const { path } = context.routes.byId
    const url = toContentServerURI(path)
    const params = { _id: docId }
    const options = { params, headers }
    const response = HTTP.get(url, options)
    const document = response.data
    
    if (document) {
      map.set(docId, document)
    }

    return document
  },
  bust: function (docId) {
    return docId === null
      ? map.clear()
      : map.delete(docId)
  },
  dispose () {
    map.clear()
    return delete map
  }
})
