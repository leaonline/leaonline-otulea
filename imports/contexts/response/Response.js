import { onServerExec } from '../../utils/archUtils'
import { iife } from '../../utils/iife'

export const Response = {
  name: 'response',
  label: 'response.title',
  icon: 'user-edit',
  representative: 'userId'
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
  schema: iife(function () {
    const { userId, ...rest } = Response.schema
    return rest
  }),
  numRequests: 50,
  timeInterval: 1000,
  run: onServerExec(function () {
    import { createSubmitResponse } from './api/createSubmitResponse'
    import { extractItemDefinition } from '../../api/scoring/extractItemDefinition'
    import { scoreResponses } from '../../api/scoring/scoreResponses'
    import { persistError } from '../errors/api/persistError'
    import { normalizeError } from '../errors/api/normalizeError'

    const submitResponse = createSubmitResponse({
      scorer: scoreResponses,
      extractor: extractItemDefinition
    })

    return function (responseDoc) {
      const self = this
      const { userId } = self

      return submitResponse({
        responseDoc,
        debug: self.debug,
        userId,
        onError: error => {
          self.info('failed to score', JSON.stringify(responseDoc))
          persistError(normalizeError({
            error,
            userId,
            method: Response.methods.submit.name
          }))
        }
      })
    }
  })
}

Response.methods.getMy = {
  name: 'response.methods.getMy',
  schema: {
    sessionId: String
  },
  numRequests: 50,
  timeInterval: 1000,
  run: onServerExec(function () {
    return function ({ sessionId }) {
      const { userId } = this

      return Response.collection().find({ userId, sessionId }).fetch()
    }
  })
}
