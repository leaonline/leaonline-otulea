import { Session } from './Session'
import { DocumentNotFoundError } from '../../api/errors/DocumentNotFoundError'

export const getSessionDoc = ({ sessionId, userId }) => {
  const sessionDoc = Session.collection().findOne({
    _id: sessionId,
    userId
  })

  if (!sessionDoc) {
    throw new DocumentNotFoundError(Session.name, { sessionId })
  }

  return sessionDoc
}
