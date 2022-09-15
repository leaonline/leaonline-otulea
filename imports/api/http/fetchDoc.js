import { Meteor } from 'meteor/meteor'
import { HTTP } from 'meteor/jkuester:http'

const origin = Meteor.absoluteUrl()
const defaultHeaders = {
  origin: origin,
  mode: 'cors',
  cache: 'no-store'
}

export const fetchDoc = (url, params) => {
  const headers = { ...defaultHeaders }
  console.debug('[fetchDoc]:', { url, headers, params })
  const requestOptions = { params, headers }
  const response = HTTP.get(url, requestOptions)
  return response.data
}
