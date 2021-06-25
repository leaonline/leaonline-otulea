import { Videos } from '../../contexts/Videos/Videos'
import { ServiceRegistry } from '../../api/services/ServiceRegistry'
import { createCollection } from '../../infrastructure/factories/collection/createCollection'
import { createMethods } from '../../infrastructure/factories/method/createMethods'
import { rateLimitMethods, rateLimitPublications } from '../../infrastructure/factories/ratelimit/rateLimit'
import { createPublications } from '../../infrastructure/factories/publication/createPublication'

const VideosCollection = createCollection(Videos)
Videos.collection = function () {
  return VideosCollection
}

const methods = Object.values(Videos.methods)
createMethods(methods)
rateLimitMethods(methods)

const publications = Object.values(Videos.publications)
createPublications(publications)
rateLimitPublications(publications)

ServiceRegistry.register(Videos)
