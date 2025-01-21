import { Session } from '../Session'
import { TestCycle } from '../../testcycle/TestCycle'
import { mapAsync } from '../../../utils/array/mapAsync'

/**
 * Returns the N recent completed sessions for given users, filters by userId
 * to return only unique entries.
 *
 * @param users {string[]} list of userIds
 * @param resolve {boolean=} optional flag to enable resolving ids
 * @return {object[]}
 */
export const recentCompleted = async function ({ users, resolve }) {
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

  const docs = (await Session.collection()
    .find(query, transform)
    .fetchAsync())
    .filter(sessionDoc => {
      if (unique.has(sessionDoc.userId)) {
        return false
      }

      unique.add(sessionDoc.userId)
      return true
    })

  if (resolve) {
    return mapAsync(docs, async sessionDoc => {
      sessionDoc.testCycle = await TestCycle.collection().findOneAsync(sessionDoc.testCycle)
      return sessionDoc
    })
  }

  return docs
}
