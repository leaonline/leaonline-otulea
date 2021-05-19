import { Feedback } from '../../contexts/feedback/Feedback'
import { createCollection } from '../../infrastructure/factories/collection/createCollection'
import { createMethods } from '../../infrastructure/factories/method/createMethods'
import { rateLimitMethods, rateLimitPublications } from '../../infrastructure/factories/ratelimit/rateLimit'
import { createPublications } from '../../infrastructure/factories/publication/createPublication'
import { createGetAllMethod } from '../../api/services/createGetAllMethod'
import { ServiceRegistry } from '../../api/services/ServiceRegistry'

const FeedbackCollection = createCollection(Feedback)
Feedback.collection = () => FeedbackCollection

Feedback.methods.getAll = createGetAllMethod({ context: Feedback })

const methods = Object.values(Feedback.methods)
createMethods(methods)
rateLimitMethods(methods)

const publications = Object.values(Feedback.publications)
createPublications(publications)
rateLimitPublications(publications)

ServiceRegistry.register(Feedback)
