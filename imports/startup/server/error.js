import { Errors } from '../../contexts/errors/Errors'
import { createCollection } from '../../infrastructure/factories/collection/createCollection'
import { createMethods } from '../../infrastructure/factories/method/createMethods'
import { rateLimitMethods } from '../../infrastructure/factories/ratelimit/rateLimit'
import { ServiceRegistry } from '../../api/services/ServiceRegistry'
import { createGetAllMethod } from '../../api/services/createGetAllMethod'
import { createGetMethod } from '../../api/services/createGetMethod'
import { getError } from '../../contexts/errors/api/getError'
import { getAllErrors } from '../../contexts/errors/api/getAllErrors'
import { createRemoveMethod } from '../../api/services/createRemoveMethod'
import { removeError } from '../../contexts/errors/api/removeError'

const collection = createCollection(Errors)
Errors.collection = () => collection

Errors.methods.get = createGetMethod({
  context: Errors,
  run: function ({ _id }) {
    return getError(_id)
  }
})

Errors.methods.getAll = createGetAllMethod({
  context: Errors,
  run: function ({ ids }) {
    return { [Errors.name]: getAllErrors(ids) }
  }
})

Errors.methods.remove = createRemoveMethod({
  context: Errors,
  run: function ({ _id }) {
    return removeError({ _id })
  }
})

const methods = Object.values(Errors.methods)
createMethods(methods)
rateLimitMethods(methods)

ServiceRegistry.register(Errors)
