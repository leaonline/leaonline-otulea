import { Meteor } from 'meteor/meteor'
import { Unit } from '../../Unit'
import { Response } from '../Response'
import { getSessionDoc } from '../../session/utils/getSessionDoc'
import { isCurrentUnit } from '../../session/utils/isCurrentUnit'

export const createSubmitResponse =
  ({ extractor, scorer }) =>
  async ({
    responseDoc = {},
    userId,
    onError = () => {},
    debug = () => {},
  } = {}) => {
    const { sessionId, unitId, responses, contentId, page } = responseDoc

    // we need to make sure, that this data belongs to the current user's
    // session by checking the unit id against the session's current unit
    const sessionDoc = sessionId && (await getSessionDoc({ sessionId, userId }))

    if (!sessionDoc || !unitId || !isCurrentUnit({ sessionDoc, unitId })) {
      throw new Meteor.Error(
        'response.submitError',
        'response.isNotCurrentUnit',
        {
          sessionId,
          unitId,
        },
      )
    }

    let scores = []
    let failed
    try {
      const unitDoc = await Unit.collection().findOneAsync(unitId)
      const itemDoc = extractor({ unitDoc, page, contentId }, debug)
      // Core scoring identifies an item as itemId, while the transport and
      // persistence contract calls the same relation contentId. Keep the raw
      // response document unchanged and adapt only the scoring handoff.
      scores = scorer({
        itemDoc,
        responseDoc: { ...responseDoc, itemId: contentId },
      })
    } catch (e) {
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
      failed,
    }

    return Response.collection().upsertAsync(
      {
        userId,
        sessionId,
        unitId,
        contentId,
      },
      { $set: scoreDoc },
    )
  }
