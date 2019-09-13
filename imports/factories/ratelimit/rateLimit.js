import { RateLimiterRegistry } from './RateLimiterRegistry'
import { check } from 'meteor/check'
import { isObject } from '../../utils/matchUtils'

export const rateLimitMethods = methods => {
  check(methods, [isObject])
  return methods.map(rateLimitMethod)
}

const rateLimitMethod = ({ name, userId, connectionId, clientAddress, numRequests, timeInterval }) => {
  // no need to check since RateLimiterRegistry does that already
  return RateLimiterRegistry.addMethod({ name, userId, connectionId, clientAddress, numRequests, timeInterval })
}

export const rateLimitPublications = publications => {
  check(publications, [isObject])
  return publications.map(rateLimitPublication)
}

const rateLimitPublication = ({ name, userId, connectionId, clientAddress, numRequests, timeInterval }) => {
  // no need to check since RateLimiterRegistry does that already
  return RateLimiterRegistry.addPublication({ name, userId, connectionId, clientAddress, numRequests, timeInterval })
}
