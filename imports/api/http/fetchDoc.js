import { Meteor } from 'meteor/meteor'
import { HTTP } from 'meteor/http'

const origin = Meteor.absoluteUrl()
const headers = {
  origin: origin,
  mode: 'cors',
  cache: 'no-store'
}

export const fetchDoc = (url, params) => {
  const requestOptions = { params, headers }
  const response = HTTP.get(url, requestOptions)
  return response.data
}
