import { Response } from '../../contexts/response/Response'
import { createCollection } from '../../infrastructure/factories/collection/createCollection'
import { createMethods } from '../../infrastructure/factories/method/createMethods'
import { rateLimitMethods } from '../../infrastructure/factories/ratelimit/rateLimit'
import { ServiceRegistry } from '../../api/services/ServiceRegistry'
import { createGetAllMethod } from '../../api/services/createGetAllMethod'

createCollection(Response)

// add service-only methods
Response.methods.getAll = createGetAllMethod({ context: Response })

const methods = Object.values(Response.methods)
createMethods(methods)
rateLimitMethods(methods)

ServiceRegistry.register(Response)
