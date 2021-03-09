import { Meteor } from 'meteor/meteor'
import { check, Match } from 'meteor/check'
import { onClient, onServer, onServerExec } from '../../utils/archUtils'
import { DocumentNotFoundError } from '../../api/errors/DocumentNotFoundError'

export const Session = {
  name: 'session',
  label: 'session.title',
  icon: 'code-fork',
  methods: {},
  publications: {}
}

Session.schema = {

  /**
   * The user who this session belongs to.
   */

  userId: String,

  /**
   * Temporal start and end indicators.
   */

  startedAt: Date,

  /**
   * See the last time the session has been updated
   */
  updatedAt: {
    type: Date,
    optional: true
  },

  /**
   * Optional flag to indicate, that this is a continued session
   */
  continuedAt: {
    type: Date,
    optional: true
  },

  /**
   * Indicate the end of a session
   */
  completedAt: {
    type: Date,
    optional: true
  },

  /**
   * The current test-cycle this session reflects on
   */

  testCycle: String,

  /**
   * The current unit set to complete. There may be more than one unit-sets
   * for a given test-cycle, because a unit-set is used to summarize a certain
   * content, while test-cycle summarize a set of tests.
   */

  unitSet: String,

  /**
   * The current unit to solve.
   * If not set the Session is considered finished (all units done)
   */
  currentUnit: {
    type: String,
    optional: true
  },

  /**
   * Progress indicates the amount of units being solved
   */

  progress: {
    type: Number,
    defaultValue: 0,
    min: 0,
    max: 100
  },

  /**
   * Optional entry to flag a session, that has been superseeded by a "restart"
   */
  cancelledAt: {
    type: Date,
    optional: true
  }
}

Session.helpers = {
  current ({ dimension, level, completedAt = { $exists: false } } = {}) {
    check(dimension, Match.Maybe(String))
    check(level, Match.Maybe(String))
    return Session.collection().findOne({
      dimension,
      level,
      completedAt
    }, { sort: { statedAt: -1 } })
  },
  byId (sessionId) {
    check(sessionId, String)
    return Session.collection().findOne(sessionId)
  },
  getNextTask ({ currentTask, tasks }) {
    if (!tasks || tasks.length === 0) {
      return
    }
    if (!currentTask) {
      return tasks[0]
    }
    const index = tasks.indexOf(currentTask)
    if (index === -1 || index >= tasks.length - 1) {
      return
    }
    return tasks[index + 1]
  },
  isComplete ({ completedAt }) {
    return Object.prototype.toString.call(completedAt) === '[object Date]'
  }
}

Session.methods.exists = {
  name: 'session.methods.exists',
  schema: {
    testCycleId: String
  },
  numRequests: 1,
  timeInterval: 1000,
  run: onServerExec(function () {
    /**
     *
     * @param unitSetId
     * @return {any}
     */
    return function run ({ testCycleId }) {
      const { userId } = this
      const SessionCollection = Session.collection()
      const sessionDoc = SessionCollection.findOne({
        userId,
        testCycle: testCycleId,
        completedAt: { $exists: false },
        cancelledAt: { $exists: false }
      })
      this.info('exists:', !!sessionDoc)
      return sessionDoc
    }
  })
}

Session.methods.currentById = {
  name: 'session.methods.currentById',
  schema: {
    sessionId: String
  },
  numRequests: 1,
  timeInterval: 1000,
  run: onServer(function ({ sessionId }) {
    const { userId } = this
    return Session.collection().findOne({
      _id: sessionId,
      userId: userId
    })
  })
}

Session.methods.start = {
  name: 'session.start',
  schema: {
    testCycleId: String
  },
  numRequests: 1,
  timeInterval: 1000,
  run: onServerExec(function () {
    import { TestCycle } from '../testcycle/TestCycle'
    import { UnitSet } from '../unitSet/UnitSet'
    import { Unit } from '../Unit'

    /**
     *
     * @param unitSet
     * @param continueAborted
     * @return {any}
     */
    return function ({ testCycleId }) {
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
  })
}

Session.methods.cancel = {
  name: 'session.methods.cancel',
  schema: {
    sessionId: String
  },
  numRequests: 1,
  timeInterval: 1000,
  run: onServerExec(function () {
    const { Response } = require('../Response')

    const hasResponses = sessionId => Response.collection().find({ sessionId }).count() > 0

    return function ({ sessionId }) {
      const { userId } = this
      const SessionCollection = Session.collection()
      const sessionDoc = SessionCollection.findOne({ _id: sessionId, userId })

      if (!sessionDoc) {
        throw new DocumentNotFoundError(Session.name, sessionId)
      }

      // if we face an empty session that is about to be restarted, we simply
      // delete this session as it holds no value to us
      if (!sessionDoc.progress && !hasResponses(sessionId)) {
        return SessionCollection.remove(sessionId)
      }

      // otherwise we update the session to indicate it's cancelled by the user
      return SessionCollection.update(sessionId, {
        $set: { cancelledAt: new Date() }
      })
    }
  })
}

Session.methods.continue = {
  name: 'session.methods.continue',
  schema: {
    sessionId: String
  },
  run: onServer(function ({ sessionId }) {
    const { userId } = this
    const SessionCollection = Session.collection()
    const sessionDoc = SessionCollection.findOne({ _id: sessionId, userId })

    if (!sessionDoc) {
      throw new DocumentNotFoundError(Session.name, sessionId)
    }

    return SessionCollection.update(sessionId, {
      $set: { continuedAt: new Date() }
    }) && SessionCollection.findOne(sessionId)
  })
}

Session.methods.update = {
  name: 'session.methods.update',
  schema: {
    sessionId: String
  },
  numRequests: 1,
  timeInterval: 1000,
  run: onServerExec(function () {
    import { UnitSet } from '../unitSet/UnitSet'
    import { TestCycle } from '../testcycle/TestCycle'
    import { isLastUnitSetInTestCycle } from '../unitSet/isLastUnitSetInTestCycle'
    import { getNextUnitSetInTestCycle } from '../unitSet/getNextUnitSetInTestCycle'

    return function ({ sessionId }) {
      const { getSessionDoc } = require('./getSessionDoc')
      const { isLastUnitInSet } = require('../unitSet/isLastUnitInSet')
      const { getNextUnitInSet } = require('../unitSet/getNextUnitInSet')

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
      const isLastUnitSet = isLastUnitSetInTestCycle(unitSet, testCycleDoc)
      const isLastUnit = isLastUnitInSet(currentUnit, unitSetDoc)

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
        return { nextUnit: null, completed: true }
      }

      // if we are through with the current unit-set., but there is still
      // another unit set to get, let's fetch it and return it's first unit

      if (isLastUnit) {
        const nextUnitSetId = getNextUnitSetInTestCycle(unitSet, testCycleDoc)
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
          hasStory,
          completed: false
        }
      }

      const nextUnit = getNextUnitInSet(currentUnit, unitSetDoc)
      Session.collection().update(sessionDoc._id, {
        $set: {
          currentUnit: nextUnit,
          updatedAt: timestamp
        }
      })

      info('session -> load next unit from current unitSet', sessionId, nextUnit)
      return { nextUnit, completed: false }
    }
  })
}

// TODO move to Response context
Session.methods.results = {
  name: 'session.methods.results',
  schema: {
    sessionId: String
  },
  numRequests: 1,
  timeInterval: 1000,
  run: onServerExec(function () {
    const { Response } = require('../Response')

    return function ({ sessionId }) {
      const { userId } = this
      const query = { sessionId, userId }

      return Response
        .collection()
        .find(query)
        .map(responseDoc => {
          return responseDoc.scores
        })
    }
  })
}

Session.methods.recent = {
  name: 'session.methods.recent',
  schema: {
    userId: {
      type: String,
      optional: true
    }
  },
  numRequests: 1,
  timeInterval: 1000,
  isPublic: true,
  run: onServer(function ({ userId }) {
    return Session.collection().find({
      userId: userId,
      startedAt: { $exists: true }
    }, {
      limit: 100,
      hint: { $natural: -1 }
    }).fetch()
  }),
  call: undefined
}

Session.methods.byTestCycle = {
  name: 'session.methods.byTestCycle',
  schema: {
    testCycleId: String
  },
  run: onServer(function ({ testCycleId }) {
    const { userId } = this

    // TODO maybe add a flag to settings.json with number of days/hours that
    // TODO define a threshold until a session can be continued.
    return Session
      .collection()
      .findOne({
        userId: userId,
        testCycle: testCycleId,
        startedAt: { $exists: true },
        completedAt: { $exists: false },
        cancelledAt: { $exists: false }
      }, {
        hint: { $natural: -1 }
      })
  })
}
