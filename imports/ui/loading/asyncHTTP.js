import { HTTP } from 'meteor/jkuester:http'

export const asyncHTTP = (method, url, requestOptions) => new Promise((resolve, reject) => {
  HTTP.call(method, url, requestOptions, (error, response) => {
    if (error) {
      return reject(error)
    }

    resolve(response)
  })
})