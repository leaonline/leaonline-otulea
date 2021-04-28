import { EJSON } from 'meteor/ejson'
import { Meteor } from 'meteor/meteor'
import { onServerExec } from '../../utils/archUtils'
import { persistError } from '../errors/api/persistError'

export const Response = {
  name: 'response',
  label: 'repsonse.title',
  icon: 'pencil'
}

Response.schema = {
  userId: String,
  sessionId: String,
  unitId: String,
  page: Number,
  contentId: String,
  responses: {
    type: Array,
    optional: true
  },
  'responses.$': String,
  scores: {
    type: Array,
    optional: true
  },
  'scores.$': Object,
  'scores.$.competency': Array,
  'scores.$.competency.$': String,
  'scores.$.score': String,
  failed: {
    type: Boolean,
    optional: true
  }
}

Response.methods = {}

Response.methods.submit = {
  name: 'response.methods.submit',
  schema: (function () {
    const { userId, ...rest } = Response.schema
    return rest
  })(),
  numRequests: 10,
  timeInterval: 1000,
  run: onServerExec(function () {
    import { Unit } from '../Unit'
    import { extractItemDefinition } from '../../api/scoring/extractItemDefinition'
    import { normalizeError } from '../errors/api/normalizeError'
    import { persistError } from '../errors/api/persistError'
    import { scoreResponses } from '../../api/scoring/scoreResponses'
    import { getSessionDoc } from '../session/utils/getSessionDoc'
    import { isCurrentUnit } from '../session/utils/isCurrentUnit'

    return function (responseDoc) {
      const { userId } = this
      const { sessionId, unitId, responses, contentId, page } = responseDoc

      // we need to make sure, that this data belongs to the current user's
      // session by checking the unit id against the session's current unit
      const sessionDoc = getSessionDoc({ userId, sessionId })

      if (!isCurrentUnit({ sessionDoc, unitId })) {
        throw new Meteor.Error('response.submitError', 'session.notCurrentUnit', {
          sessionDoc, unitId
        })
      }

      let scores = []
      let failed = undefined
      try {
        const unitDoc = Unit.collection().findOne(unitId)
        const itemDoc = extractItemDefinition({ unitDoc, page, contentId })
        scores = scoreResponses({ itemDoc, responseDoc })
      }
      catch (e) {
        console.info('[Response]: failed to score', EJSON.stringify(responseDoc))
        persistError(normalizeError({
          error,
          userId,
          method: Response.methods.submit.name
        }))
        failed = true
      }

      const scoreDoc = {
        userId,
        sessionId,
        unitId,
        responses,
        contentId,
        page,
        scores,
        failed
      }
      return Response.collection().upsert({
        userId,
        sessionId,
        unitId,
        contentId
      }, { $set: scoreDoc })
    }
  })
}
