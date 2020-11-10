import { Feedback } from '../../api/config/Feedback'
import { ServiceRegistry } from '../../api/config/BackendConfig'
import { createCollection } from '../../factories/collection/createCollection'
import { createMethods } from '../../factories/method/createMethods'
import { rateLimitMethods, rateLimitPublications } from '../../factories/ratelimit/rateLimit'
import { createPublications } from '../../factories/publication/createPublication'

const FeedbackCollection = createCollection(Feedback)
Feedback.collection = () => FeedbackCollection

const methods = Object.values(Feedback.methods)
createMethods(methods)
rateLimitMethods(methods)

const publications = Object.values(Feedback.publications)
createPublications(publications)
rateLimitPublications(publications)

ServiceRegistry.register(Feedback)
