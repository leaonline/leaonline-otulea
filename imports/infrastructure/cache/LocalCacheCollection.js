import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { HTTP } from 'meteor/jkuester:http'
import { onServerExec } from '../../utils/archUtils'
import { toContentServerURI } from '../../api/loading/toContentServerURI'
import { createInfoLog } from '../../api/errors/createInfoLog'
import { createFixedHMAC } from '../crypto/createFixedHMAC'

const getAuthToken = createFixedHMAC(Meteor.settings.hosts.content.secret)
const origin = Meteor.absoluteUrl()

export class LocalCacheCollection extends Mongo.Collection {
  constructor (context, options) {
    super(null, options)
    this.url = toContentServerURI(context.routes.byId.path)
    this.log = createInfoLog(context.name)
  }

  findOne (selector, options, callback) {
    const { url, log } = this
    const doc = super.findOne(selector, options)

    if (doc) {
      return doc
    }

    if (typeof selector !== 'string' && !(selector?._id)) {
      log('insufficient selector to fetch vie HTTP')
      return
    }

    const headers = {
      origin: origin,
      mode: 'cors',
      cache: 'no-store'
      // 'X-Auth-Token': getAuthToken()
    }

    const params = { _id: selector._id || selector }
    const requestOptions = { params, headers }

    log('request doc', selector, 'from url', url)

    let document

    try {
      document = fetchDoc.call(this, url, requestOptions)
    } catch (e) {
      console.warn(e)
    }

    return document
  }
}

function fetchDoc (url, requestOptions) {
  const response = HTTP.get(url, requestOptions)
  const doc = response.data
  if (doc) {
    this.upsert(doc._id, { $set: doc })
  }
  return doc
}
