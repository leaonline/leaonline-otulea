import { Logos } from '../../api/config/Logos'
import { BackendConfig } from '../../api/config/BackendConfig'
import { createCollection } from '../../factories/collection/createCollection'
import { createMethods } from '../../factories/method/createMethods'
import { rateLimitMethods, rateLimitPublications } from '../../factories/ratelimit/rateLimit'
import { createPublications } from '../../factories/publication/createPublication'

const LogosCollection = createCollection(Logos)
Logos.collection = function () {
  return LogosCollection
}

const methods = Object.values(Logos.methods)
createMethods(methods)
rateLimitMethods(methods)

const publications = Object.values(Logos.publications)
createPublications(publications)
rateLimitPublications(publications)

function replacer (name, val) {
  if (typeof val === 'function') {
    return val.prototype.constructor.name
  } else {
    return val
  }
}

BackendConfig.add({
  name: Logos.name,
  label: Logos.label,
  icon: Logos.icon,
  type: 'document',
  actions: {
    update: {
      method: Logos.methods.update.name,
      schema: JSON.stringify(Logos.methods.update.schema, replacer)
    }
  },
  roles: ['editLogos'], // TODO put in Roles
  group: 'editors', // TODO put in Groups,
  isFilesCollection: false,
  mainCollection: Logos.name,
  collections: [
    Logos.name
  ],
  publications: [{
    name: Logos.publications.single.name
  }]
})
