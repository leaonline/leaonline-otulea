import { check, Match } from 'meteor/check'
import { SHA256 } from 'meteor/sha'
import { Meteor } from 'meteor/meteor'
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter'

export const isNothingStringOrFunction = Match.Where(arg => arg ? (typeof arg === 'string' || typeof arg === 'function') : true)

const _names = {}
const _methods = {}
const _subscriptions = {}
const _rules = {}

DDPRateLimiter.setErrorMessage(function (options) {
  // const timeToReset = Math.round(options.timeToReset / 1000)
  return 'errors.slowDown' //, { timeToReset })
})

function checkArgs ({ name, userId, connectionId, clientAddress, numRequests, timeInterval }) {
  check(name, String)
  check(userId, isNothingStringOrFunction)
  check(connectionId, isNothingStringOrFunction)
  check(clientAddress, isNothingStringOrFunction)
  check(numRequests, Number)
  check(timeInterval, Number)
}

function defaultUserId (userId) {
  return userId && Meteor.users.findOne(userId)
}

function defaultConnectionId () {
  return true
}

function defaultClientAddress () {
  return true
}

function _run (map, type, limitExceededCallback) {
  Object.values(map).forEach(ruleGroup => {
    const { numRequests } = ruleGroup
    const { timeInterval } = ruleGroup
    const { names } = ruleGroup
    const { userId } = ruleGroup
    const { connectionId } = ruleGroup
    const { clientAddress } = ruleGroup

    function name (name) {
      return !!(names[name])
    }

    const ruleId = DDPRateLimiter.addRule({
      type,
      name,
      userId: (userId || defaultUserId),
      connectionId: (connectionId || defaultConnectionId),
      clientAddress: (clientAddress || defaultClientAddress)
    }, numRequests, timeInterval, limitExceededCallback)
    _rules[ruleId] = name
  })
}

function add (target, { name, userId, connectionId, clientAddress, numRequests, timeInterval }) {
  const argsStr = JSON.stringify({ userId, connectionId, clientAddress, numRequests, timeInterval })
  const key = SHA256(argsStr)
  if (!target[key]) {
    const names = {}
    target[key] = { names, userId, connectionId, clientAddress, numRequests, timeInterval }
  }
  target[key].names[name] = true
  _names[name] = true
  return true
}

function checkAll (functions, type, strict) {
  return functions
    .map(fct => typeof fct === 'function' ? fct.name : fct)
    .filter(name => name && name.length > 0)
    .forEach(target => {
      if (!RateLimiterRegistry.has(target)) {
        const rateLimitError = new Error(`FATAL - ${type} <${target}> is not rate limited`)
        if (strict) {
          throw rateLimitError
        } else {
          console.error(rateLimitError)
        }
      }
    })
}

export const RateLimiterRegistry = {
  addMethod ({ name, userId, connectionId, clientAddress, numRequests, timeInterval }) {
    checkArgs({ name, userId, connectionId, clientAddress, numRequests, timeInterval })
    add(_methods, { name, userId, connectionId, clientAddress, numRequests, timeInterval })
  },

  addPublication ({ name, userId, connectionId, clientAddress, numRequests, timeInterval }) {
    checkArgs({ name, userId, connectionId, clientAddress, numRequests, timeInterval })
    add(_subscriptions, { name, userId, connectionId, clientAddress, numRequests, timeInterval })
  },

  has (name) {
    return !!(_names[name])
  },

  remove (id) {
    if (_rules[id]) {
      DDPRateLimiter.removeRule(id)
      const name = _rules[id]
      delete _rules[id]
      delete _names[name]
    }
  },

  run (limitExceededCallback) {
    _run(_methods, 'method', limitExceededCallback)
    _run(_subscriptions, 'subscription', limitExceededCallback)
  },

  sanityCheck (strict = true) {
    checkAll(Object.values(Meteor.server.method_handlers), 'method', strict)
    checkAll(Object.keys(Meteor.server.publish_handlers), 'publication', strict)
  }
}
