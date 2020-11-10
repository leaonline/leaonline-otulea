import { Meteor } from 'meteor/meteor'
import { HTTP } from 'meteor/http'
import { createLog } from '../../utils/createInfoLog'

export const UrlService = {}

const contentServer = Meteor.settings.public.hosts.content
const contentRoot = contentServer.url
const info = createLog({
  name: 'UrlService',
  type: 'info',
  devOnly: true
})

UrlService.content = {}

UrlService.content.url = function (path) {
  return `${contentRoot}${path}`
}

UrlService.content.call = function ({ path, method, headers }, params, callback) {
  const url = UrlService.content.url(path)
  info('request', url)
  return HTTP.call(method, url, { headers, params }, (err, res) => {
    info('received', res)
    if (err) {
      return callback(err)
    }

    if (!res || !res.content) {
      return callback(new Error('Unexpected missing response'))
    }
    try {
      console.log(res)
      const parsed = JSON.parse(res.content)
      return callback(null, parsed)
    } catch (parseJsonException) {
      return callback(parseJsonException)
    }
  })
}
