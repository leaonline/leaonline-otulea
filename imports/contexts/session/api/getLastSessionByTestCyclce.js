import { Session } from '../Session'

const projection = {
  hint: { $natural: -1 },
}

/**
 * Gets the LATEST single RUNNING session for a given test cycle id
 * @param testCycleId
 * @param userId
 * @param completed
 * @async
 * @return {Promise.<object|undefined>}
 */
export const getLastSessionByTestCylce = ({ testCycleId, trialId, userId }) => {
  const query = {
    userId: userId,
    testCycle: testCycleId,
    startedAt: { $exists: true },
    cancelledAt: { $exists: false },
  }

  if (trialId) query.trialId = trialId

  // TODO maybe add a flag to settings.json with number of days/hours that
  // TODO define a threshold until a session can be continued.
  return Session.collection().findOneAsync(query, projection)
}
