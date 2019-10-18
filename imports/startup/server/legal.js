import { Legal } from '../../api/config/Legal'
import { BackendConfig } from '../../api/config/BackendConfig'
import { createCollection } from '../../factories/collection/createCollection'
import { createMethods } from '../../factories/method/createMethods'
import { rateLimitMethods, rateLimitPublications } from '../../factories/ratelimit/rateLimit'
import { createPublications } from '../../factories/publication/createPublication'

const LegalCollection = createCollection(Legal)

const methods = Object.values(Legal.methods)
createMethods(methods)
rateLimitMethods(methods)

const publications = Object.values(Legal.publications)
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
  name: Legal.name,
  label: Legal.label,
  icon: Legal.icon,
  type: 'document',
  actions: {
    update: {
      method: Legal.methods.update.name,
      schema: JSON.stringify(Legal.schema, replacer)
    }
  },
  roles: [ 'editLegal' ], // TODO put in Roles
  group: 'editors', // TODO put in Groups,
  isFilesCollection: false,
  mainCollection: Legal.name,
  collections: [
    Legal.name
  ],
  publications: [ {
    name: Legal.publications.single.name
  } ]
})


Meteor.startup(() =>{
  Legal.helpers.init(LegalCollection)
})