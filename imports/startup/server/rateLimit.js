import { Meteor } from 'meteor/meteor'
import { runRateLimiter } from '../../infrastructure/factories/ratelimit/rateLimit'

const logAttempt = (...args) => console.log(...args)

Meteor.startup(() => {
  runRateLimiter(function callback (reply, input) {
    if (reply.allowed) {
      return undefined
    } else {
      console.log('rate limit exceeded')
      console.log(reply)
      logAttempt(input)
    }
  })
})
