import { ErrorLog } from '../../api/errors/ErrorLog'
import { createCollection } from '../../factories/collection/createCollection'
import { createMethods } from '../../factories/method/createMethods'
import { rateLimitMethods } from '../../factories/ratelimit/rateLimit'

createCollection(ErrorLog)

const methods = Object.values(ErrorLog.methods)
createMethods(methods)
rateLimitMethods(methods)
