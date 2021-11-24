import { Meteor } from 'meteor/meteor'
import { check, Match } from 'meteor/check'
import { isValidInteger } from '../utils/number/validNumbers'
import { Session } from '../contexts/session/Session'
import { Response } from '../contexts/response/Response'

const daysIsValid = d => isValidInteger(d) && d >= 0

/**
 * We can safely remove accounts, that have not started any session and is older
 * or as old as three days.
 * We also include that the session must be completed, otherwise the user may
 * have just started a session, aborted and then left the application.
 *
 * @param removeOlderThanDays {Number} a valid integer > 0
 * @param dryRun {Boolean} no actual DB writes will be performed
 * @param dryRun {byComment} additional, optional flag to delete by comment field
 * @param removeIncompleteSessions {Boolean} set to true if you also want to remove users that
 *   started a session but never completed one
 * @param debug {Function|undefined} log debug statements
 * @return {{
 *   sessionsRemoved: Number
 *   responsesRemoved: Number
 *   usersRemoved : Number
 * }}
 */
export const removeDeadAccounts = function ({ dryRun, removeOlderThanDays, removeIncompleteSessions = false, byComment, debug = () => {} }) {
  check(removeOlderThanDays, Match.Where(daysIsValid))
  check(removeIncompleteSessions, Match.Maybe(Boolean))
  check(byComment, Match.Maybe(String))
  check(dryRun, Match.Maybe(Boolean))
  check(debug, Match.Maybe(Function))

  const lastDate = new Date()
  lastDate.setDate(lastDate.getDate() - removeOlderThanDays)

  const sessionCollection = Session.collection()
  const userIds = []
  const userQuery = { createdAt: { $lte: lastDate } }

  if (byComment) {
    userQuery.comment = byComment
  }

  Meteor.users.find(userQuery).forEach(userDoc => {
    const userId = userDoc._id
    const sessionQuery = { userId }

    if (removeIncompleteSessions) {
      sessionQuery.completedAt = { $exists: true }
    }

    const count = sessionCollection.find(sessionQuery).count()
    debug(userId, sessionQuery, count)

    if (count === 0) {
      userIds.push(userDoc._id)
    }
  })

  // skip early to avoid expensive DB access
  if (userIds.length === 0 || dryRun) {
    debug('no users, skip')
    return {
      sessionsRemoved: 0,
      responsesRemoved: 0,
      usersRemoved: 0
    }
  }

  const responseCollection = Response.collection()
  const inUserIds = { $in: userIds }
  const sessionsRemoved = sessionCollection.remove({ userId: inUserIds })
  const responsesRemoved = responseCollection.remove({ userId: inUserIds })
  const usersRemoved = Meteor.users.remove({ _id: inUserIds })

  return { sessionsRemoved, responsesRemoved, usersRemoved }
}
