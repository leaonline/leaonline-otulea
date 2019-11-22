import { Meteor } from 'meteor/meteor'
import { Feedback } from '../../api/config/Feedback'
import { BackendConfig } from '../../api/config/BackendConfig'
import { createCollection } from '../../factories/collection/createCollection'
import { createMethods } from '../../factories/method/createMethods'
import { rateLimitMethods, rateLimitPublications } from '../../factories/ratelimit/rateLimit'
import { createPublications } from '../../factories/publication/createPublication'

const FeedbackColleciton = createCollection(Feedback)
Feedback.collection = function () {
  return FeedbackColleciton
}

const methods = Object.values(Feedback.methods)
createMethods(methods)
rateLimitMethods(methods)

const publications = Object.values(Feedback.publications)
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
  name: Feedback.name,
  label: Feedback.label,
  icon: Feedback.icon,
  type: 'document',
  actions: {
    update: {
      method: Feedback.methods.update.name,
      schema: JSON.stringify(Feedback.schema, replacer)
    }
  },
  roles: [ 'editFeedback' ], // TODO put in Roles
  group: 'editors', // TODO put in Groups,
  isFilesCollection: false,
  mainCollection: Feedback.name,
  collections: [
    Feedback.name
  ],
  publications: [ {
    name: Feedback.publications.single.name
  } ]
})
