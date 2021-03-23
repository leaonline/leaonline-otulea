import { Response } from '../../response/Response'

export const getSessionResponses = function getSessionResponses ({ sessionId, userId }) {
  const query = { sessionId, userId }

  return Response
    .collection()
    .find(query)
    .map(responseDoc => {
      return responseDoc.scores
    })
}
