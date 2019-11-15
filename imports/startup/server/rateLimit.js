import { Meteor } from 'meteor/meteor'
import { RateLimiterRegistry } from '../../factories/ratelimit/RateLimiterRegistry'

const logAttempt = (...args) => console.log(...args)

Meteor.startup(() => {
  RateLimiterRegistry.run(function callback (reply, input) {
    if (reply.allowed) {
      return undefined
    } else {
      console.log('rate limit exceeded')
      console.log(reply)
      logAttempt(input)
    }
  })
})
