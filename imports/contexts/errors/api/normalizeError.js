import { Meteor } from 'meteor/meteor'

export const normalizeError = ({ error, userId, template, isMethod, isPublication, isEndpoint, isSystem }) => {
  const errorDoc = ('errorType' in error)
    ? normalizeMeteorError(error)
    : normalizeNativeError(error)

  errorDoc.template = template
  errorDoc.isClient = Meteor.isClient
  errorDoc.isServer = Meteor.isServer
  errorDoc.isMethod = isMethod || false
  errorDoc.isPublication = isPublication || false
  errorDoc.isEndpoint = isEndpoint || false
  errorDoc.isSystem = isSystem || false

  const hashInput = JSON.stringify(errorDoc)
  errorDoc.hash = simpleHash(hashInput)

  // add timestamp/user after hash so we can track duplicates
  // across different users and temporal boundaries
  errorDoc.createdAt = new Date()
  errorDoc.createdBy = userId

  return errorDoc
}

const normalizeMeteorError = error => ({
  name: error.error,
  type: error.errorType,
  message: error.reason,
  details: error.details,
  stack: error.stack
})

const normalizeNativeError = error => ({
  name: error.name,
  type: 'Native.Error',
  message: error.message,
  details: error.details,
  stack: error.stack
})

/**
 * See https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript
 * @param str
 * @return {number}
 */
const simpleHash = str => {
  let hash = 0
  let i
  let chr

  if (str.length === 0) {
    return hash
  }

  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + chr
    hash |= 0 // Convert to 32bit integer
  }
  return hash
}
