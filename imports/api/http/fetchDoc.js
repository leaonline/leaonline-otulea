import { Meteor } from 'meteor/meteor'
import { HTTP } from 'meteor/jkuester:http'

const origin = Meteor.absoluteUrl()
const defaultHeaders = {
  origin: origin,
  mode: 'cors',
  cache: 'no-store',
}

/**
 * Fetches a doc from given URL
 * @param url
 * @param params
 * @return {Promise<*>}
 */
export const fetchDoc = async (url, params) => {
  const headers = { ...defaultHeaders }
  console.debug('[fetchDoc]:', { url, headers, params })
  const requestOptions = { params, headers }
  const response = await HTTP.get(url, requestOptions)
  return response.data
}
