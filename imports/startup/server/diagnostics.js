import { Diagnostics } from '../../contexts/diagnostics/Diagnostics'
import { createMethods } from '../../infrastructure/factories/method/createMethods'
import { rateLimitMethods } from '../../infrastructure/factories/ratelimit/rateLimit'
import { createCollection } from '../../infrastructure/factories/collection/createCollection'
import { ServiceRegistry } from '../../api/services/ServiceRegistry'

const collection = createCollection(Diagnostics)
Diagnostics.collection = () => collection

const allMethods = Object.values(Diagnostics.methods)
createMethods(allMethods)
rateLimitMethods(allMethods)

ServiceRegistry.register(Diagnostics)
