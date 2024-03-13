import { Session } from '../Session'
import { TestCycle } from '../../testcycle/TestCycle'

/**
 * Returns the N recent completed sessions for given users, filters by userId
 * to return only unique entries.
 *
 * @param users {string[]} list of userIds
 * @param resolve {boolean=} optional flag to enable resolving ids
 * @return {object[]}
 */
export const recentCompleted = function ({ users, resolve }) {
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
    sort: {
      completedAt: -1
    },
    hint: { $natural: -1 }
  }

  const docs = Session.collection()
    .find(query, transform)
    .fetch()
    .filter(sessionDoc => {
      if (unique.has(sessionDoc.userId)) {
        return false
      }

      unique.add(sessionDoc.userId)
      return true
    })

  if (resolve) {
    return docs.map(sessionDoc => {
      sessionDoc.testCycle = TestCycle.collection().findOne(sessionDoc.testCycle)
      return sessionDoc
    })
  }

  return docs
}
