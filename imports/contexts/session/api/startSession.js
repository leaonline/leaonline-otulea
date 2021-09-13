import { Meteor } from 'meteor/meteor'
import { check, Match } from 'meteor/check'
import { TestCycle } from '../../testcycle/TestCycle'
import { UnitSet } from '../../unitSet/UnitSet'
import { Session } from '../Session'
import { Unit } from '../../Unit'
import { checkDocument } from '../../../infrastructure/mixins/checkDocument'
import { getDocument } from '../../../infrastructure/mixins/getDocument'

/**
 * Starts a new session for a given test cycle.
 *
 * The test cycle inherits a set of unit sets and thus units.
 * There is at least one unit set with at least one unit each.
 *
 * @param options.testCycleId
 * @param options.userId {string}
 * @return {any}
 */
export const startSession = function startSession (options = {}) {
  check(options, Match.ObjectIncluding({
    testCycleId: String,
    userId: String
  }))

  const { testCycleId, userId } = options

  const SessionCollection = Session.collection()
  const abortedSessionDoc = SessionCollection.findOne({
    userId,
    testCycle: testCycleId,
    completedAt: { $exists: false },
    cancelledAt: { $exists: false }
  })

  // There may be the the case where we find an aborted session.
  if (abortedSessionDoc) {
    throw new Meteor.Error('session.start.error', 'session.existsAlready', {
      sessionId: abortedSessionDoc._id,
      unitSetId: testCycleId
    })
  }

  // for a new session we stamp the start time and get the referenced
  // unitSet document in order to store the associated dimension, level and
  // ordered set of units to be solved.
  const testCycleDoc = getDocument(testCycleId, TestCycle)
  checkDocument(testCycleDoc, TestCycle, { testCycleId })

  // get the initial unit-set
  const unitSetId = testCycleDoc.unitSets?.[0]
  const unitSetDoc = getDocument(unitSetId, UnitSet)
  const progress = 0
  const maxProgress = testCycleDoc.progress

  // we also strictly require the unitSetDoc to start a session
  checkDocument(unitSetDoc, UnitSet, { unitSetId })

  // get the initial unit
  const currentUnit = unitSetDoc.units?.[0]
  const unitDoc = getDocument(currentUnit, Unit)

  // unit is also strictly required to start a session
  checkDocument(unitDoc, Unit, { currentUnit })

  // if all docs exist, we can create a new session document
  const startedAt = new Date()
  const insertDoc = { userId, startedAt, currentUnit, progress, maxProgress }
  insertDoc.testCycle = testCycleId
  insertDoc.unitSet = unitSetId

  const newSessionId = SessionCollection.insert(insertDoc)
  return SessionCollection.findOne(newSessionId)
}
