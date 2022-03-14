import { Logos } from '../../contexts/logos/Logos'
import { createCollection } from '../../infrastructure/factories/collection/createCollection'
import { createMethods } from '../../infrastructure/factories/method/createMethods'
import { rateLimitMethods } from '../../infrastructure/factories/ratelimit/rateLimit'
import { ServiceRegistry } from '../../api/services/ServiceRegistry'

const LogosCollection = createCollection(Logos)
Logos.collection = () => LogosCollection

const methods = Object.values(Logos.methods)
createMethods(methods)
rateLimitMethods(methods)

ServiceRegistry.register(Logos)
