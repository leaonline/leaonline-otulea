import { TestCycle } from '../../testcycle/TestCycle'
import { Meteor } from 'meteor/meteor'
import { UnitSet } from '../../unitSet/UnitSet'
import { Session } from '../Session'
import { Unit } from '../../Unit'

/**
 * Starts a new session for a given test cycle.
 *
 * The test cycle inherits a set of unit sets and thus units.
 * There is at least one unit set with at least one unit each.
 *
 * @param testCycleId
 * @return {any}
 */
export const startSession = function startSession ({ testCycleId }) {
  const API = this
  const { userId } = API
  const SessionCollection = Session.collection()
  const abortedSessionDoc = SessionCollection.findOne({
    userId,
    testCycle: testCycleId,
    completedAt: { $exists: false },
    cancelledAt: { $exists: false }
  })

  // There may be the the case where we find an aborted session.
  if (abortedSessionDoc) {
    throw new Meteor.Error('session.start.error', 'session.sessionExists', {
      sessionId: abortedSessionDoc._id,
      unitSetId: testCycleId
    })
  }

  // for a new session we stamp the start time and get the referenced
  // unitSet document in order to store the associated dimension, level and
  // ordered set of units to be solved.
  const startedAt = new Date()
  const testCycleDoc = API.getDocument(testCycleId, TestCycle)
  API.checkDocument(testCycleDoc, TestCycle, { testCycleId })

  // get the initial unit-set
  const unitSetId = testCycleDoc.unitSets?.[0]
  const unitSetDoc = API.getDocument(unitSetId, UnitSet)

  // we also strictly require the unitSetDoc to start a session
  API.checkDocument(unitSetDoc, UnitSet, { unitSetId })

  // get the initial unit
  const currentUnit = unitSetDoc.units?.[0]
  const unitDoc = API.getDocument(currentUnit, Unit)

  // unit is also strictly required to start a session
  API.checkDocument(unitDoc, Unit, { currentUnit })

  // if all docs exist, we can create a new session document
  const insertDoc = { userId, startedAt, currentUnit }
  insertDoc.testCycle = testCycleId
  insertDoc.unitSet = unitSetId

  const newSessionId = SessionCollection.insert(insertDoc)
  return SessionCollection.findOne(newSessionId)
}
