import { Mongo } from 'meteor/mongo'
import { fetchDoc } from '../../../api/http/fetchDoc'

export class LocalCacheCollection extends Mongo.Collection {
  constructor (url, log, options) {
    super(null, options)
    this.url = url
    this.log = log || (() => {})
  }

  async findOneAsync (selector, options) {
    const { url, log } = this
    const doc = selector
      ? await super.findOneAsync(selector, options)
      : await super.findOneAsync()

    // we skip early if the doc is already in the collection
    if (doc) {
      return doc
    }

    if (typeof selector !== 'string' && !(selector?._id)) {
      throw new Error(`insufficient selector to fetch via HTTP: ${String(selector)}`)
    }

    const params = { _id: selector._id || selector }
    log('request doc', selector, 'from url', url)

    const document = await fetchDoc(url, params)

    if (document) {
      // we need to clone the document in order to prevent collection2 from
      // accidentally cleaning things that should not be cleaned
      const result = await this.upsertAsync(document._id, { $set: { ...document } })
      this.log(result)
    }

    return document
  }
}
