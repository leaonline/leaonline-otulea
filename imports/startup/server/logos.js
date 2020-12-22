import { Logos } from '../../contexts/Logos'
import { ServiceRegistry } from '../../api/config/BackendConfig'
import { createCollection } from '../../infrastructure/factories/collection/createCollection'
import { createMethods } from '../../infrastructure/factories/method/createMethods'
import { rateLimitMethods, rateLimitPublications } from '../../infrastructure/factories/ratelimit/rateLimit'
import { createPublications } from '../../infrastructure/factories/publication/createPublication'

const LogosCollection = createCollection(Logos)
Logos.collection = () => LogosCollection

const methods = Object.values(Logos.methods)
createMethods(methods)
rateLimitMethods(methods)

const publications = Object.values(Logos.publications)
createPublications(publications)
rateLimitPublications(publications)

ServiceRegistry.register(Logos)
