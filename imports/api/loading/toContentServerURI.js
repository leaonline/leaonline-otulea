import { Meteor } from 'meteor/meteor'

const contentServer = Meteor.settings.public.hosts.content
const contentRoot = contentServer.url

function fixEncode (str) {
  return encodeURIComponent(str)
    .replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16))
}

export const toContentServerURI = (path, params) => {
  const base = new URL(`${contentRoot}${path}`)
  if (params) {
    // seee https://stackoverflow.com/a/62969380 on because why
    base.search =
      Object.entries(params)
        .map(([key, value]) => {
          console.info(value, encodeURIComponent(value))
          if (Array.isArray(value)) {
            return value.map(entry => `${fixEncode(key)}=${fixEncode(entry)}`).join('&')
          } else {
            return `${fixEncode(key)}=${fixEncode(value)}`
          }
        })
        .join('&')
  }
  return base.toString()
}
