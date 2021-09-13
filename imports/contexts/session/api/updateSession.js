import { check, Match } from 'meteor/check'
import { Session } from '../Session'
import { UnitSet } from '../../unitSet/UnitSet'
import { TestCycle } from '../../testcycle/TestCycle'
import { getSessionDoc } from '../utils/getSessionDoc'
import { createDocumentList } from '../../../api/lists/createDocumentList'
import { checkDocument } from '../../../infrastructure/mixins/checkDocument'
import { getDocument } from '../../../infrastructure/mixins/getDocument'
import { Unit } from '../../Unit'

/**
 * Updates a session document by id.
 *
 * Will increment the current unit to the next or unitset to the next or complete
 * the session, if no further unit / unitset are left.
 *
 * @param options.sessionId {String} id of the session doc
 * @param options.userId {String} id of the current user
 * @return {{
 *  nextUnit: String|null,
 *  nextUnitSet: String|null,
 *  hasStory: Boolean,
 *  completed: Boolean
 * }}
 */
export const updateSession = function (options = {}) {
  check(options, Match.ObjectIncluding({
    sessionId: String,
    userId: String,
    debug: Match.Maybe(Function)
  }))

  const { sessionId, userId, debug = () => {} } = options

  // verify given session
  const sessionDoc = getSessionDoc({ sessionId, userId })
  checkDocument(sessionDoc, Session, { sessionId, userId })

  const { unitSet, testCycle, currentUnit } = sessionDoc

  // get test cycle doc
  const testCycleDoc = getDocument(testCycle, TestCycle)
  checkDocument(testCycleDoc, TestCycle, {
    testCycle,
    sessionId,
    userId
  })

  // get unitSet doc
  const unitSetDoc = getDocument(unitSet, UnitSet)
  checkDocument(unitSetDoc, UnitSet, { sessionId, unitSet })

  // get unit doc
  const unitDoc = getDocument(currentUnit, Unit)
  checkDocument(unitDoc, Unit, { sessionId, currentUnit })
  const progressIncrement = unitDoc.pages?.length

  debug('update session')

  const unitSetList = createDocumentList({
    context: TestCycle,
    fieldName: 'unitSets',
    document: testCycleDoc,
    currentId: unitSet
  })

  const unitList = createDocumentList({
    context: UnitSet,
    fieldName: 'units',
    document: unitSetDoc,
    currentId: currentUnit
  })

  const timestamp = new Date()
  const isLastUnitSet = unitSetList.isLast()
  const isLastUnit = unitList.isLast()

  // OPTION 1
  // if this is the last unit set AND the last unit in this set, we are
  // through with the session's associated testCycle

  if (isLastUnitSet && isLastUnit) {
    Session.collection().update(sessionDoc._id, {
      $set: {
        currentUnit: null,
        updatedAt: timestamp,
        completedAt: timestamp
      },
      $inc: {
        progress: progressIncrement
      }
    })

    debug('session -> testcycle complete', sessionId)
    return {
      nextUnit: null,
      nextUnitSet: null,
      hasStory: false,
      completed: true
    }
  }

  // OPTION 2
  // if we are through with the current unit-set., but there is still
  // another unit set to get, let's fetch it and return it's first unit

  if (isLastUnit) {
    const nextUnitSetId = unitSetList.getNext()
    const nextUnitSetDoc = getDocument(nextUnitSetId, UnitSet)
    checkDocument(nextUnitSetDoc, UnitSet, {
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
      },
      $inc: {
        progress: progressIncrement
      }
    })

    const hasStory = nextUnitSetDoc.story?.length > 0
    debug('session -> load next unit from new unitSet', sessionId, firstUnit, hasStory)
    return {
      nextUnit: firstUnit,
      nextUnitSet: nextUnitSetId,
      hasStory: hasStory,
      completed: false
    }
  }

  // OPTION 3
  // We have neither completed and iterate to the next unit
  const nextUnit = unitList.getNext()

  Session.collection().update(sessionDoc._id, {
    $set: {
      currentUnit: nextUnit,
      updatedAt: timestamp
    },
    $inc: {
      progress: progressIncrement
    }
  })

  debug('session -> load next unit from current unitSet', sessionId, nextUnit)
  return {
    nextUnit: nextUnit,
    nextUnitSet: null,
    hasStory: false,
    completed: false
  }
}
