import { Response } from '../../contexts/response/Response'
import { createCollection } from '../../infrastructure/factories/collection/createCollection'
import { createMethods } from '../../infrastructure/factories/method/createMethods'
import { rateLimitMethods } from '../../infrastructure/factories/ratelimit/rateLimit'

createCollection(Response)

const methods = Object.values(Response.methods)
createMethods(methods)
rateLimitMethods(methods)
