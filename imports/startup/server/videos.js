import { Videos } from '../../api/config/Videos'
import { BackendConfig } from '../../api/config/BackendConfig'
import { createCollection } from '../../factories/collection/createCollection'
import { createMethods } from '../../factories/method/createMethods'
import { rateLimitMethods, rateLimitPublications } from '../../factories/ratelimit/rateLimit'
import { createPublications } from '../../factories/publication/createPublication'

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

BackendConfig.add({
  name: Videos.name,
  label: Videos.label,
  icon: Videos.icon,
  type: 'document',
  actions: {
    update: {
      method: Videos.methods.update.name,
      schema: JSON.stringify(Videos.methods.update.schema, replacer)
    }
  },
  roles: [ 'editVideos' ], // TODO put in Roles
  group: 'editors', // TODO put in Groups,
  isFilesCollection: false,
  mainCollection: Videos.name,
  collections: [
    Videos.name
  ],
  publications: [ {
    name: Videos.publications.single.name
  } ]
})
