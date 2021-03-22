import { Session } from '../Session'
import { UnitSet } from '../../unitSet/UnitSet'
import { TestCycle } from '../../testcycle/TestCycle'
import { getSessionDoc } from '../utils/getSessionDoc'
import { createDocumentList } from '../../../api/lists/createDocumentList'

/**
 * Updates a session document by id.
 *
 * Will increment the current unit to the next or unitset to the next or complete
 * the session, if no further unit / unitset are left.
 *
 * @param sessionId {String} id of the session doc
 * @return {{
 *  nextUnit: String|null,
 *  nextUnitSet: String|null,
 *  hasStory: Boolean,
 *  completed: Boolean
 * }}
 */
export const updateSession = function ({ sessionId }) {
  const API = this
  const { userId, info } = API
  const sessionDoc = getSessionDoc({ sessionId, userId })
  API.checkDocument(sessionDoc, Session, { sessionId, userId })

  const { unitSet, testCycle, currentUnit } = sessionDoc

  // get test cycle doc
  const testCycleDoc = API.getDocument(testCycle, TestCycle)
  API.checkDocument(testCycleDoc, TestCycle, {
    testCycle,
    sessionId,
    userId
  })

  // get unit set doc
  const unitSetDoc = API.getDocument(unitSet, UnitSet)
  API.checkDocument(unitSetDoc, UnitSet, { sessionId, unitSet })

  info('update', currentUnit, unitSetDoc.units)
  const timestamp = new Date()

  const unitSetList = createDocumentList({
    currentId: unitSet,
    document: testCycleDoc,
    context: TestCycle,
    fieldName: 'unitSets'
  })

  const unitList = createDocumentList({
    currentId: currentUnit,
    document: unitSetDoc,
    context: UnitSet,
    fieldName: 'units',
  })

  const isLastUnitSet = unitSetList.isLast()
  const isLastUnit = unitList.isLast()

  // if this is the last unit set AND the last unit in this set, we are
  // through with the session's associated testCycle

  if (isLastUnitSet && isLastUnit) {
    Session.collection().update(sessionDoc._id, {
      $set: {
        currentUnit: null,
        updatedAt: timestamp,
        completedAt: timestamp
      }
    })

    info('session -> testcycle complete', sessionId)
    return {
      nextUnit: null,
      nextUnitSet: null,
      hasStory: false,
      completed: true
    }
  }

  // if we are through with the current unit-set., but there is still
  // another unit set to get, let's fetch it and return it's first unit

  if (isLastUnit) {
    const nextUnitSetId = unitSetList.getNext()
    const nextUnitSetDoc = API.getDocument(nextUnitSetId, UnitSet)
    API.checkDocument(nextUnitSetDoc, UnitSet, {
      nextUnitSetId,
      sessionId,
      userId
    })

    const firstUnit = nextUnitSetDoc.units[0]

    Session.collection().update(sessionDoc._id, {
      $set: {
        unitSet: nextUnitSetId,
        currentUnit: firstUnit,
        updatedAt: timestamp
      }
    })

    const hasStory = nextUnitSetDoc.story?.length > 0
    info('session -> load next unit from new unitSet', sessionId, firstUnit, hasStory)
    return {
      nextUnit: firstUnit,
      nextUnitSet: nextUnitSetId,
      hasStory: hasStory,
      completed: false
    }
  }

  const nextUnit = unitList.getNext()

  Session.collection().update(sessionDoc._id, {
    $set: {
      currentUnit: nextUnit,
      updatedAt: timestamp
    }
  })

  info('session -> load next unit from current unitSet', sessionId, nextUnit)
  return {
    nextUnit: nextUnit,
    nextUnitSet: null,
    hasStory: false,
    completed: false
  }
}