import { Meteor } from 'meteor/meteor'
import { HTTP } from 'meteor/http'

export const UrlService = {}

const contentServer = Meteor.settings.public.hosts.content
const contentRoot = contentServer.url

UrlService.content = {}

UrlService.content.url = function (path) {
  return `${contentRoot}${path}`
}

UrlService.content.call = function ({ path, method, headers }, params, callback) {
  const url = UrlService.content.url(path)
  return HTTP.call(method, url, { headers, params }, (err, res) => {
    if (err) {
      return callback(err)
    }
    if (!res || !res.content) {
      return callback()
    }
    try {
      const parsed = JSON.parse(res.content)
      return callback(null, parsed)
    } catch (parseJsonException) {
      return callback(parseJsonException)
    }
  })
}
