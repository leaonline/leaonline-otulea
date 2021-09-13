import { Meteor } from 'meteor/meteor'
import { check, Match } from 'meteor/check'
import { Session } from '../Session'
import { sessionIsComplete } from '../utils/sessionIsComplete'
import { sessionIsCancelled } from '../utils/sessionIsCancelled'
import { checkDocument } from '../../../infrastructure/mixins/checkDocument'

/**
 * Continues an aborted (but not cancelled session= session
 * @param options.sessionId
 * @param options.userId
 * @return {*}
 */
export const continueSession = function continueSession (options = {}) {
  check(options, Match.ObjectIncluding({
    sessionId: String,
    userId: String
  }))

  const { sessionId, userId } = options
  const SessionCollection = Session.collection()
  const sessionDoc = SessionCollection.findOne({ _id: sessionId, userId })
  checkDocument(sessionDoc, Session)

  if (sessionIsComplete(sessionDoc)) {
    throw new Meteor.Error('session.continueFailed', 'session.isComplete', {
      sessionId, userId, completedAt: sessionDoc.completedAt
    })
  }

  if (sessionIsCancelled(sessionDoc)) {
    throw new Meteor.Error('session.continueFailed', 'session.isCancelled', {
      sessionId, userId, cancelledAt: sessionDoc.cancelledAt
    })
  }

  return SessionCollection.update(sessionId, {
    $set: { continuedAt: new Date() }
  }) && SessionCollection.findOne(sessionId)
}
