import { onServerExec } from '../../utils/archUtils'
import { Session } from '../session/Session'

export const Feedback = {
  name: 'feedback',
  label: 'feedback.title',
  icon: 'star-half-alt'
}

Feedback.schema = {
  sessionId: String,
  testCycle: String,
  userId: String,

  // XXX: added to collection in order to provide a one-step access
  // to feedbacks from teacher dashboard, filtered by dimension
  dimension: {
    type: String,
    optional: true
  },

  competencies: Array,
  'competencies.$': Object,
  'competencies.$.competencyId': String,
  'competencies.$.count': Number,
  'competencies.$.scored': Number,
  'competencies.$.undef': Number,
  'competencies.$.perc': Number,
  'competencies.$.gradeName': String,
  'competencies.$.gradeIndex': Number,
  'competencies.$.isGraded': Boolean,

  alphaLevels: Array,
  'alphaLevels.$': Object,
  'alphaLevels.$.alphaLevelId': String,
  'alphaLevels.$.count': Number,
  'alphaLevels.$.scored': Number,
  'alphaLevels.$.perc': Number,
  'alphaLevels.$.gradeName': String,
  'alphaLevels.$.gradeIndex': Number,
  'alphaLevels.$.isGraded': Boolean
}

Feedback.publications = {}

Feedback.methods = {}

Feedback.methods.generate = {
  name: 'feedback.methods.generate',
  schema: {
    sessionId: String
  },
  run: onServerExec(function () {
    import { generateFeedback } from './api/generateFeedback'

    return function ({ sessionId }) {
      const { userId, debug } = this
      return generateFeedback({ sessionId, userId, debug })
    }
  })
}

// TODO move the following methods into own context, for example "Teacher"

Feedback.methods.recent = {
  name: 'feedback.methods.recent',
  schema: {
    users: Array,
    'users.$': String
  },
  backend: true,
  run: onServerExec(function () {
    import { Session } from '../session/Session'

    return function ({ users }) {
      const unique = new Set()
      const query = { userId: { $in: users } }
      const transform = { limit: users.length + 1, hint: { $natural: -1 } }

      return Session.collection()
        .find(query, transform)
        .fetch()
        .filter(sessionDoc => {
          if (unique.has(sessionDoc.userId)) {
            return false
          }

          unique.add(sessionDoc.userId)
          return true
        })
    }
  })
}

Feedback.methods.getForUsers = {
  name: 'feedback.methods.getForUsers',
  schema: {
    dimension: {
      type: String
    },
    users: Array,
    'users.$': String,
    skip: {
      type: Array,
      optional: true
    },
    'skip.$': String,
  },
  backend: true,
  run: onServerExec(function () {
    import { Session } from '../session/Session'

    return function ({ users = [], dimension, skip = [] }) {
      const query = {
        userId: { $in: users },
        dimension: dimension,
        completedAt: { $exists: true }
      }

      // skip allows to not include those docs, which are
      // already cached on the target server

      if (skip.length > 0) {
        query._id = { $nin: skip }
      }

      const unique = new Set()

      Session.collection()
        .find(query)
        .fetch()



      const feedbackDocs = Feedback.collection().find(query).fetch()


      // if we add sessions we need to iterate the docs and get all session
      // docs as well in order to fulfill them in one request

      const sessionIds = new Set()
      feedbackDocs.forEach(doc => sessionIds.add(doc.sessionId))


      // now we need to filter these documents

      return { feedbackDocs, sessionDocs }
    }
  })
}
