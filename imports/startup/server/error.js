import { Meteor } from 'meteor/meteor'
import { Errors } from '../../contexts/errors/Errors'
import { createCollection } from '../../infrastructure/factories/collection/createCollection'
import { createMethods } from '../../infrastructure/factories/method/createMethods'
import { rateLimitMethods } from '../../infrastructure/factories/ratelimit/rateLimit'
import { ServiceRegistry } from '../../api/services/ServiceRegistry'

console.dev = (...args) => {
  if (Meteor.isDevelopment) {
    console.info(...args)
  }
}

const collection = createCollection(Errors)
Errors.collection = () => collection

const methods = Object.values(Errors.methods)
createMethods(methods)
rateLimitMethods(methods)

ServiceRegistry.register(Errors)
