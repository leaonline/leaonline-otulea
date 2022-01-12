import { Record } from '../../contexts/record/Record'
import { createCollection } from '../../infrastructure/factories/collection/createCollection'
import { createMethods } from '../../infrastructure/factories/method/createMethods'
import { rateLimitMethods } from '../../infrastructure/factories/ratelimit/rateLimit'
import { ServiceRegistry } from '../../api/services/ServiceRegistry'
import { createGetAllMethod } from '../../api/services/createGetAllMethod'

createCollection(Record)

// add service-only methods
Record.methods.getAll = createGetAllMethod({ context: Record })

const methods = Object.values(Record.methods)
createMethods(methods)
rateLimitMethods(methods)

ServiceRegistry.register(Record)
