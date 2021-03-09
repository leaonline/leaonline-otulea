import { Response } from '../../Response'

export const getSessionResponses = function getSessionResults ({ sessionId }) {
  const { userId } = this
  const query = { sessionId, userId }

  return Response
    .collection()
    .find(query)
    .map(responseDoc => {
      return responseDoc.scores
    })
}
