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

    // we skip early if the doc is already in the collection
    if (doc) {
      return doc
    }

    if (typeof selector !== 'string' && !(selector?._id)) {
      throw new Error(`insufficient selector to fetch via HTTP: ${String(selector)}`)
    }

    const params = { _id: selector._id || selector }
    log('request doc', selector, 'from url', url)

    const document = fetchDoc(url, params)

    if (document) {
      this.upsert(document._id, { $set: document })
    }

    return document
  }
}
