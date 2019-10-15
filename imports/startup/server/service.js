import { BackendConfig } from '../../api/config/BackendConfig'
import { createMethods } from '../../factories/method/createMethods'
import { rateLimitMethods } from '../../factories/ratelimit/rateLimit'

const methods = Object.values(BackendConfig.methods)
createMethods(methods)
rateLimitMethods(methods)
