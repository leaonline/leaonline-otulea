import { Meteor } from 'meteor/meteor'
import { runRateLimiter } from '../../infrastructure/factories/ratelimit/rateLimit'
import { normalizeError } from '../../contexts/errors/api/normalizeError'
import { persistError } from '../../contexts/errors/api/persistError'

Meteor.startup(() => {
  runRateLimiter(function callback (reply, input) {
    if (reply.allowed) {
      return undefined
    }
    else {
      console.debug('[RateLimiter]: rate limit exceeded')
      console.debug(reply)
      console.debug(input)
      const data = { ...reply, ...input }
      persistError(normalizeError({
        error: new Meteor.Error('400', 'errors.rateLimitExceeded', data),
        userId: input.userId,
        method: input.name
      }))
    }
  })
})
