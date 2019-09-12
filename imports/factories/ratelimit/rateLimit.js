import { RateLimiterRegistry } from './RateLimiterRegistry'
import { check } from 'meteor/check'
import { isObject } from '../../utils/matchUtils'

export const rateLimitMethods = methods => {
  check(methods, [ isObject ])
  return methods.map(rateLimitMethod)
}

export const rateLimitMethod = ({ name, userId, connectionId, clientAddress, numRequests, timeInterval }) => {
  // no need to check since RateLimiterRegistry does that already
  return RateLimiterRegistry.addMethod({ name, userId, connectionId, clientAddress, numRequests, timeInterval })
}