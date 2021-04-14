import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { HTTP } from 'meteor/jkuester:http'

const origin = Meteor.absoluteUrl()

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

    const headers = {
      origin: origin,
      mode: 'cors',
      cache: 'no-store'
    }

    const params = { _id: selector._id || selector }
    const requestOptions = { params, headers }


    let document

    try {
      log('request doc', selector, 'from url', url)
      document = fetchDoc(this, url, requestOptions)
    }
    catch (e) {
      console.error(e)
      log(e)
    }

    return document
  }
}

function fetchDoc (self, url, requestOptions) {
  const response = HTTP.get(url, requestOptions)
  const doc = response.data

  if (doc) {
    const docId = doc._id
    delete doc._id

    self.upsert(docId, { $set: doc })
  }

  return doc
}
