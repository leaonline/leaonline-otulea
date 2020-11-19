import { Session } from '../../contexts/session/Session'
import { createCollection } from '../../infrastructure/factories/collection/createCollection'
import { createMethods } from '../../infrastructure/factories/method/createMethods'
import { rateLimitMethods, rateLimitPublications } from '../../infrastructure/factories/ratelimit/rateLimit'
import { createPublications } from '../../infrastructure/factories/publication/createPublication'

createCollection(Session)

const methods = Object.values(Session.methods)
createMethods(methods)
rateLimitMethods(methods)

const publications = Object.values(Session.publications)
rateLimitPublications(publications)
createPublications(publications)
