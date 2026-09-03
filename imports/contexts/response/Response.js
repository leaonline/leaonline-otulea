import { onServerExec } from '../../utils/archUtils'
import { iife } from '../../utils/iife'

export const Response = {
  name: 'response',
  label: 'response.title',
  icon: 'user-edit',
  representative: 'userId',
}

Response.schema = {
  userId: String,
  sessionId: String,
  unitId: String,
  page: Number,
  contentId: String,
  responses: {
    type: Array,
    optional: true,
  },
  'responses.$': String,
  scores: {
    type: Array,
    optional: true,
  },
  'scores.$': Object,
  'scores.$.competency': Array,
  'scores.$.competency.$': String,
  'scores.$.score': String,
  failed: {
    type: Boolean,
    optional: true,
  },
}

Response.methods = {}

Response.methods.submit = {
  name: 'response.methods.submit',
  schema: iife(() => {
    const { userId, ...rest } = Response.schema
    return rest
  }),
  numRequests: 50,
  timeInterval: 1000,
  run: onServerExec(() => {
    const { createSubmitResponse } = require('./api/createSubmitResponse')
    const {
      extractItemDefinition,
    } = require('../../api/scoring/extractItemDefinition')
    const { scoreResponses } = require('../../api/scoring/scoreResponses')
    const { persistError } = require('../errors/api/persistError')
    const { normalizeError } = require('../errors/api/normalizeError')

    const submitResponse = createSubmitResponse({
      scorer: scoreResponses,
      extractor: extractItemDefinition,
    })

    return async function (responseDoc) {
      const self = this
      const { userId } = self

      return submitResponse({
        responseDoc,
        debug: self.debug,
        userId,
        onError: async (error) => {
          self.info('failed to score', JSON.stringify(responseDoc))
          await persistError(
            normalizeError({
              error,
              userId,
              method: Response.methods.submit.name,
            }),
          )
        },
      })
    }
  }),
}

Response.methods.getMy = {
  name: 'response.methods.getMy',
  schema: {
    sessionId: String,
  },
  numRequests: 50,
  timeInterval: 1000,
  run: onServerExec(
    () =>
      async function ({ sessionId }) {
        const { userId } = this
        return Response.collection().find({ userId, sessionId }).fetchAsync()
      },
  ),
}
