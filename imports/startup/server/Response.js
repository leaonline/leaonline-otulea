import { Response } from '../../api/session/Response'
import { createCollection } from '../../factories/collection/createCollection'
import { createMethods } from '../../factories/method/createMethods'
import { rateLimitMethods } from '../../factories/ratelimit/rateLimit'

createCollection(Response)

const methods = Object.values(Response.methods)
createMethods(methods)
rateLimitMethods(methods)
