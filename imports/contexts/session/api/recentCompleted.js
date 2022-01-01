import { Session } from '../Session'

/**
 * Returns the N recent completed sessions for given users, filters by userId
 * to return only unique entries.
 *
 * @param users
 * @return {*}
 */
export const recentCompleted = function ({ users }) {
  const unique = new Set()
  const query = {
    userId: { $in: users },
    completedAt: { $exists: true }
  }
  const limit = users.length < 15
    ? users.length + 1
    : 15
  const transform = {
    limit: limit,
    hint: { $natural: -1 }
  }

  return Session.collection()
    .find(query, transform)
    .fetch()
    .filter(sessionDoc => {
      if (unique.has(sessionDoc.userId)) {
        return false
      }

      unique.add(sessionDoc.userId)
      return true
    })
}
