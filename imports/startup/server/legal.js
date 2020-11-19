import { Meteor } from 'meteor/meteor'
import { Legal } from '../../api/config/Legal'
import { ServiceRegistry } from '../../api/config/BackendConfig'
import { createCollection } from '../../infrastructure/factories/collection/createCollection'
import { createMethods } from '../../infrastructure/factories/method/createMethods'
import { rateLimitMethods, rateLimitPublications } from '../../infrastructure/factories/ratelimit/rateLimit'
import { createPublications } from '../../infrastructure/factories/publication/createPublication'

const LegalCollection = createCollection(Legal)
Legal.collection = () => LegalCollection

const methods = Object.values(Legal.methods)
createMethods(methods)
rateLimitMethods(methods)

const publications = Object.values(Legal.publications)
createPublications(publications)
rateLimitPublications(publications)

ServiceRegistry.register(Legal)

Meteor.startup(() => {
  Legal.helpers.init(LegalCollection)
})
