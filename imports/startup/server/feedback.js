import { Feedback } from '../../api/config/Feedback'
import { ServiceRegistry } from '../../api/config/BackendConfig'
import { createCollection } from '../../infrastructure/factories/collection/createCollection'
import { createMethods } from '../../infrastructure/factories/method/createMethods'
import { rateLimitMethods, rateLimitPublications } from '../../infrastructure/factories/ratelimit/rateLimit'
import { createPublications } from '../../infrastructure/factories/publication/createPublication'

const FeedbackCollection = createCollection(Feedback)
Feedback.collection = () => FeedbackCollection

const methods = Object.values(Feedback.methods)
createMethods(methods)
rateLimitMethods(methods)

const publications = Object.values(Feedback.publications)
createPublications(publications)
rateLimitPublications(publications)

ServiceRegistry.register(Feedback)
