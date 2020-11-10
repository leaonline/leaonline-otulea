import { Meteor } from 'meteor/meteor'
import { ErrorLog } from '../../api/errors/ErrorLog'
import { createCollection } from '../../factories/collection/createCollection'
import { createMethods } from '../../factories/method/createMethods'
import { rateLimitMethods } from '../../factories/ratelimit/rateLimit'

console.dev = (...args) => {
  if (Meteor.isDevelopment) {
    console.info(...args)
  }
}

const collection = createCollection(ErrorLog)
ErrorLog.collection = () => collection

const methods = Object.values(ErrorLog.methods)
createMethods(methods)
rateLimitMethods(methods)
