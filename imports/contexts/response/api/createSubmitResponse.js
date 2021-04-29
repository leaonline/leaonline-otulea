import { Unit } from '../../Unit'
import { Response } from '../Response'
import { getSessionDoc } from '../../session/utils/getSessionDoc'
import { isCurrentUnit } from '../../session/utils/isCurrentUnit'

export const createSubmitResponse = ({ extractor, scorer }) => function submitResponse ({ responseDoc = {}, userId, onError = () => {} } = {}) {
  const { sessionId, unitId, responses, contentId, page } = responseDoc

  // we need to make sure, that this data belongs to the current user's
  // session by checking the unit id against the session's current unit
  const sessionDoc = sessionId && getSessionDoc({ sessionId, userId })

  if (!sessionDoc || !unitId || !isCurrentUnit({ sessionDoc, unitId })) {
    throw new Meteor.Error('response.submitError', 'response.isNotCurrentUnit', {
      sessionId, unitId
    })
  }

  let scores = []
  let failed = undefined
  try {
    const unitDoc = Unit.collection().findOne(unitId)
    const itemDoc = extractor({ unitDoc, page, contentId })
    scores = scorer({ itemDoc, responseDoc })
  }
  catch (e) {
    onError(e)
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