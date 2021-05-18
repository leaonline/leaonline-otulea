import { onServerExec } from '../../utils/archUtils'

export const Session = {
  name: 'session',
  label: 'session.title',
  icon: 'project-diagram',
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
   * Indicate the end of a session
   */
  completedAt: {
    type: Date,
    optional: true
  },

  /**
   * See the last time the session has been updated
   */
  updatedAt: {
    type: Date,
    optional: true
  },

  /**
   * Optional entry to flag a session, that has been superseded by a "restart"
   */
  cancelledAt: {
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
   * Progress indicates the amount of units (pages = tasks) being solved
   */

  progress: {
    type: Number,
    defaultValue: 0,
    min: 0
  },

  maxProgress: {
    type: Number,
    defaultValue: 0,
    min: 0
  }
}

Session.methods.currentById = {
  name: 'session.methods.currentById',
  schema: {
    sessionId: String
  },
  numRequests: 10,
  timeInterval: 1000,
  run: onServerExec(function () {
    import { getSessionDoc } from './utils/getSessionDoc'

    return function ({ sessionId }) {
      const { userId } = this
      return getSessionDoc({ sessionId, userId })
    }
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
    import { startSession } from './api/startSession'

    return function ({ testCycleId }) {
      const api = this
      return startSession({
        testCycleId: testCycleId,
        userId: api.userId
      })
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
    import { cancelSession } from './api/cancelSession'

    return function ({ sessionId }) {
      const api = this
      return cancelSession({
        sessionId: sessionId,
        userId: api.userId
      })
    }
  })
}

Session.methods.continue = {
  name: 'session.methods.continue',
  schema: {
    sessionId: String
  },
  numRequests: 1,
  timeInterval: 1000,
  run: onServerExec(function () {
    import { continueSession } from './api/continueSession'

    return function ({ sessionId }) {
      const api = this
      return continueSession({
        sessionId: sessionId,
        userId: api.userId
      })
    }
  })
}

Session.methods.next = {
  name: 'session.methods.next',
  schema: {
    sessionId: String
  },
  numRequests: 1,
  timeInterval: 1000,
  run: onServerExec(function () {
    import { updateSession } from './api/updateSession'
    return function ({ sessionId }) {
      const api = this
      return updateSession({
        sessionId: sessionId,
        userId: api.userId,
        debug: api.debug
      })
    }
  })
}

Session.methods.results = {
  name: 'session.methods.results',
  schema: {
    sessionId: String
  },
  numRequests: 1,
  timeInterval: 1000,
  run: onServerExec(function () {
    import { getSessionResponses } from './api/getSessionResponses'

    return function ({ sessionId }) {
      const { userId } = this
      return getSessionResponses({ sessionId, userId })
    }
  })
}

Session.methods.byTestCycle = {
  name: 'session.methods.byTestCycle',
  schema: {
    testCycleId: String
  },
  run: onServerExec(function () {
    import { getLastSessionByTestCylce } from './api/getLastSessionByTestCyclce'

    return function ({ testCycleId }) {
      const { userId } = this
      return getLastSessionByTestCylce({ testCycleId, userId })
    }
  })
}
