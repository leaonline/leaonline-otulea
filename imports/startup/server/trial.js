import {Trial} from "../../contexts/trial/Trial";
import { createCollection } from '../../infrastructure/factories/collection/createCollection'
import { createMethods } from '../../infrastructure/factories/method/createMethods'
import {
    rateLimitMethods,
    rateLimitPublications,
} from '../../infrastructure/factories/ratelimit/rateLimit'
import { createPublications } from '../../infrastructure/factories/publication/createPublication'
import { ServiceRegistry } from '../../api/services/ServiceRegistry'
import { createGetAllMethod } from '../../api/services/createGetAllMethod'
import {createGetMethod} from "../../api/services/createGetMethod";

createCollection(Trial)

const methods = Object.values(Trial.methods)
createMethods(methods)
rateLimitMethods(methods)

const publications = Object.values(Trial.publications)
rateLimitPublications(publications)
createPublications(publications)

ServiceRegistry.register(Trial)
