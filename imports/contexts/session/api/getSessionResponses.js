import { Response } from '../../response/Response'

export const getSessionResponses = async function getSessionResponses({
  sessionId,
  userId,
}) {
  const query = { sessionId, userId }
  const docs = await Response.collection().find(query).fetchAsync()

  return docs.map((responseDoc) => responseDoc.scores)
}
