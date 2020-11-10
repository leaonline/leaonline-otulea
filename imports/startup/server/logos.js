import { Logos } from '../../api/config/Logos'
import { ServiceRegistry } from '../../api/config/BackendConfig'
import { createCollection } from '../../factories/collection/createCollection'
import { createMethods } from '../../factories/method/createMethods'
import { rateLimitMethods, rateLimitPublications } from '../../factories/ratelimit/rateLimit'
import { createPublications } from '../../factories/publication/createPublication'

const LogosCollection = createCollection(Logos)
Logos.collection = () => LogosCollection

const methods = Object.values(Logos.methods)
createMethods(methods)
rateLimitMethods(methods)

const publications = Object.values(Logos.publications)
createPublications(publications)
rateLimitPublications(publications)

ServiceRegistry.register(Logos)
