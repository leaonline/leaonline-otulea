import { Meteor } from 'meteor/meteor'
import { EJSON } from 'meteor/ejson'

export const normalizeError = ({ error, browser, userId, template, method, publication, endpoint, isSystem }) => {
  import { simpleHash } from '../../../utils/simpleHash'

  const errorDoc = ('errorType' in error)
    ? normalizeMeteorError(error)
    : normalizeNativeError(error)

  errorDoc.template = template
  errorDoc.isClient = Meteor.isClient
  errorDoc.isServer = Meteor.isServer
  errorDoc.method = method
  errorDoc.publication = publication
  errorDoc.endpoint = endpoint
  errorDoc.isSystem = isSystem || false
  errorDoc.browser = (Meteor.isClient && browser)
    ? EJSON.stringify(browser)
    : undefined

  const hashInput = `${userId || ''}${errorDoc.browser || ''}${method || ''}${publication || ''}${endpoint || ''}${error.stack}`
  errorDoc.hash = simpleHash(hashInput)

  // add timestamp/user after hash so we can track duplicates
  // across different users and temporal boundaries
  errorDoc.createdAt = new Date()
  errorDoc.createdBy = userId || 'system'

  return errorDoc
}

const normalizeMeteorError = error => ({
  name: error.error,
  type: error.errorType,
  message: error.reason,
  details: stringifyDetails(error.details),
  stack: truncateStack(error.stack)
})

const normalizeNativeError = error => ({
  name: error.name,
  type: 'Native.Error',
  message: error.message,
  details: stringifyDetails(error.details),
  stack: truncateStack(error.stack)
})

const stringifyDetails = details => {
  const type = typeof details
  if (type === 'undefined' || details === null) return
  if (type === 'object') return EJSON.stringify(details)
  return EJSON.stringify({ details })
}

const truncateStack = (stack = '') => {
  const lines = stack.split(/\n/g)
  if (lines.length > 3) {
    lines.length = 3
  }
  return lines.join('\n')
}
