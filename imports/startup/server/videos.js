import { Videos } from '../../api/config/Videos'
import { ServiceRegistry } from '../../api/config/BackendConfig'
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

function replacer (name, val) {
  if (typeof val === 'function') {
    return val.prototype.constructor.name
  } else {
    return val
  }
}

ServiceRegistry.register(Videos)
