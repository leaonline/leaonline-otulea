import { Mongo } from 'meteor/mongo'
import { fetchDoc } from '../../../api/http/fetchDoc'

export class LocalCacheCollection extends Mongo.Collection {
  constructor (url, log, options) {
    super(null, options)
    this.url = url
    this.log = log || (() => {})
  }

  findOne (selector, options) {
    const { url, log } = this
    const doc = selector
      ? super.findOne(selector, options)
      : super.findOne()

    if (doc) {
      return doc
    }

    if (typeof selector !== 'string' && !(selector?._id)) {
      log('insufficient selector to fetch via HTTP')
      return
    }

    const params = { _id: selector._id || selector }

    let document

    try {
      log('request doc', selector, 'from url', url)
      document = fetchDoc(this, url, params)

      if (document) {
        const docId = document._id
        delete document._id
        this.upsert(docId, { $set: document })
      }
    }
    catch (e) {
      console.error(e)
      log(e)
    }

    return document
  }
}


