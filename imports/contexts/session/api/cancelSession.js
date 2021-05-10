import { check, Match } from 'meteor/check'
import { Session } from '../Session'
import { isEmptySession } from '../utils/isEmptySession'
import { checkDocument } from '../../../infrastructure/mixins/checkDocument'

/**
 * Cancels a running session.
 *
 * If there is no session progress and no responses it will be removed.
 *
 * Otherwise it will be updated with a {cancelledAt} flag.
 *
 * @param options.sessionId {String} id of the session
 * @param options.userId {String} id of the user
 * @return {*}
 */
export const cancelSession = function cancelSession (options = {}) {
  check(options, Match.ObjectIncluding({
    sessionId: String,
    userId: String
  }))

  const { sessionId, userId } = options
  const SessionCollection = Session.collection()
  const sessionDoc = SessionCollection.findOne({ _id: sessionId, userId })

  checkDocument(sessionDoc, Session, { sessionId, userId })

  // if we face an empty session that is about to be restarted, we simply
  // delete this session as it holds no value to us
  if (isEmptySession(sessionDoc)) {
    return SessionCollection.remove(sessionId)
  }

  // otherwise we update the session to indicate it's cancelled by the user
  return SessionCollection.update(sessionId, {
    $set: { cancelledAt: new Date() }
  })
}
