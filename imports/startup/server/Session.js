import { Session } from '../../contexts/session/Session'
import { createCollection } from '../../infrastructure/factories/collection/createCollection'
import { createMethods } from '../../infrastructure/factories/method/createMethods'
import { rateLimitMethods, rateLimitPublications } from '../../infrastructure/factories/ratelimit/rateLimit'
import { createPublications } from '../../infrastructure/factories/publication/createPublication'
import { ServiceRegistry } from '../../api/services/ServiceRegistry'
import { createGetAllMethod } from '../../api/services/createGetAllMethod'

createCollection(Session)

Session.methods.getAll = createGetAllMethod({ context: Session })

const methods = Object.values(Session.methods)
createMethods(methods)
rateLimitMethods(methods)

const publications = Object.values(Session.publications)
rateLimitPublications(publications)
createPublications(publications)

ServiceRegistry.register(Session)
