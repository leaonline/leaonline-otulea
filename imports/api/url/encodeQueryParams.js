// Use this function in favour of encodeURIComponent or URL
// see https://stackoverflow.com/a/62969380 on because why

const unsupportedChars = /[!'()*]/g
const fixedEncodeURIComponent = str => encodeURIComponent(str)
  .replace(unsupportedChars, c => '%' + c.charCodeAt(0).toString(16))

const toEncodedParams = ([key, value]) => {
  if (Array.isArray(value)) {
    return value.map(entry => `${fixedEncodeURIComponent(key)}=${fixedEncodeURIComponent(entry)}`).join('&')
  }

  return `${fixedEncodeURIComponent(key)}=${fixedEncodeURIComponent(value)}`
}

export const encodeQueryParams = params => Object.entries(params)
  .map(toEncodedParams)
  .join('&')
