import { Meteor } from 'meteor/meteor'
import { EJSON } from 'meteor/ejson'
import { lazyRequire } from '../../../utils/lazyRequire'

const { maxStackSize } = Meteor.settings.public.error

/**
 * Harmonizes different error types (Meteor.Error, Error etc.) for saving to the DB
 * @param error
 * @param browser
 * @param userId
 * @param code
 * @param template
 * @param method
 * @param publication
 * @param endpoint
 * @param isSystem
 * @return {{stack: (string|string), name, details: (*), type: *, message}|{stack: (string|string), name, details: (*), type: string, message}}
 */
export const normalizeError = ({
  error,
  browser,
  userId,
  code,
  template,
  method,
  publication,
  endpoint,
  isSystem,
}) => {
  const simpleHash = getSimplehash()
  const errorDoc =
    'errorType' in error
      ? normalizeMeteorError(error)
      : normalizeNativeError(error)

  errorDoc.code = code
  errorDoc.template = template
  errorDoc.isClient = Meteor.isClient
  errorDoc.isServer = Meteor.isServer
  errorDoc.method = method
  errorDoc.publication = publication
  errorDoc.endpoint = endpoint
  errorDoc.isSystem = isSystem || false
  errorDoc.browser =
    Meteor.isClient && browser ? EJSON.stringify(browser) : undefined

  const hashInput = `${userId || ''}${errorDoc.browser || ''}${method || ''}${publication || ''}${endpoint || ''}${error.stack}`
  errorDoc.hash = simpleHash(hashInput)

  // add timestamp/user after hash so we can track duplicates
  // across different users and temporal boundaries
  errorDoc.createdAt = new Date()
  errorDoc.createdBy = userId || 'system'

  return errorDoc
}

/**
 * @private
 * @type {function(): *}
 */
const getSimplehash = lazyRequire(() => {
  const { simpleHash } = require('../../../utils/simpleHash')
  return simpleHash
})

/**
 * @private
 * @param error
 * @return {{name, type, message, details: (*), stack: (string|string)}}
 */
const normalizeMeteorError = (error) => ({
  name: error.error,
  type: error.errorType,
  message: error.reason,
  details: stringifyDetails(error.details),
  stack: truncateStack(error.stack),
})

/**
 * @private
 * @param error
 * @return {{name, type: string, message, details: (*), stack: (string|string)}}
 */
const normalizeNativeError = (error) => ({
  name: error.name,
  type: 'Native.Error',
  message: error.message,
  details: stringifyDetails(error.details),
  stack: truncateStack(error.stack),
})

/**
 * @private
 * @param details
 * @return {*}
 */
const stringifyDetails = (details) => {
  const type = typeof details
  if (type === 'undefined' || details === null) return
  if (type === 'object') return EJSON.stringify(details)
  return EJSON.stringify({ details })
}

/**
 * @private
 * @param stack
 * @return {string}
 */
const truncateStack = (stack = '') => {
  if (stack.length < maxStackSize) {
    return stack
  }

  return stack.substring(0, maxStackSize)
}
