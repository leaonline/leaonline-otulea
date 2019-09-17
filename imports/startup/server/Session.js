import { Session } from '../../api/session/Session'
import { createCollection } from '../../factories/collection/createCollection'
import { createMethods } from '../../factories/method/createMethods'
import { rateLimitMethods, rateLimitPublications } from '../../factories/ratelimit/rateLimit'
import { createPublications } from '../../factories/publication/createPublication'

createCollection(Session)

const methods = Object.values(Session.methods)
createMethods(methods)
rateLimitMethods(methods)

const publications = Object.values(Session.publications)
rateLimitPublications(publications)
createPublications(publications)
