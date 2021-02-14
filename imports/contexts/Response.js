import { EJSON } from 'meteor/ejson'
import { Meteor } from 'meteor/meteor'
import { onServerExec } from '../utils/archUtils'

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
  'scores.$.competency': String,
  'scores.$.score': String
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
    import { SessionsHost } from '../api/hosts/SessionsHost'
    const { scoreResponses } = require('../api/scoring/scoreResponses')
    const { getSessionDoc } = require('./session/getSessionDoc')
    const { isCurrentUnit } = require('./session/isCurrentUnit')

    return function (responseDoc) {
      // this.unblock()
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
      try {
        scores = scoreResponses(responseDoc)
      }
      catch (e) {
        console.info('failed response', EJSON.stringify({ userId, sessionId, unitId, page, contentId }))
        console.error(e)
      }

      const scoreDoc = { userId, sessionId, unitId, responses, contentId, page, scores }

      // if we could not send the score, due to undefined reasons, we simply
      // store it here and try to send it later (for example on eval)
      try {
        return SessionsHost.methods.submitResponse({ userId, sessionId, unitId, responses, contentId, page, scores })
      }
      catch (e) {
        return Response.collection().upsert({ userId, sessionId, unitId, contentId }, { $set: scoreDoc })
      }
    }
  })
}
