import { Meteor } from 'meteor/meteor'
import { check, Match } from 'meteor/check'
import { Role } from '../accounts/Role'
import { Group } from '../accounts/Group'
import { onClient, onServer, onServerExec } from '../../utils/archUtils'
import { getCollection } from '../../utils/collectionuUtils'
import { PermissionDeniedError } from '../errors/PermissionDenied'
import { DocumentNotFoundError } from '../errors/DocumentNotFoundError'
import { SessionsHost } from '../hosts/SessionsHost'
import { UnitSet } from './UnitSet'

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
   * The current unit set to complete
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
  getProgress ({ currentTask, tasks }) {
    const index = tasks.indexOf(currentTask) + 1
    return Math.floor(100 * (index / (tasks.length)))
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
  }
}

Session.methods.exists = {
  name: 'session.methods.exists',
  schema: {
    unitSetId: String
  },
  numRequests: 1,
  timeInterval: 1000,
  run: onServerExec(function () {
    import { UnitSet } from './UnitSet'

    const getUnitSetDoc = docId => UnitSet.helpers.getDocument(docId)

    /**
     *
     * @param unitSetId
     * @return {any}
     */
    return function run ({ unitSetId }) {
      const { userId } = this
      const SessionCollection = Session.collection()
      return SessionCollection.findOne({
        userId,
        unitSet: unitSetId,
        completedAt: { $exists: false },
        cancelledAt: { $exists: false }
      })
    }
  })
}

Session.methods.start = {
  name: 'session.start',
  schema: {
    unitSetId: String,
  },
  numRequests: 1,
  timeInterval: 1000,
  run: onServerExec(function () {
    import { UnitSet } from './UnitSet'

    const getUnitSetDoc = docId => UnitSet.helpers.getDocument(docId)

    /**
     *
     * @param unitSet
     * @param continueAborted
     * @return {any}
     */
    return function ({ unitSetId }) {
      const { userId } = this
      const SessionCollection = Session.collection()
      const abortedSessionDoc = SessionCollection.findOne({
        userId,
        unitSet: unitSetId,
        completedAt: { $exists: false },
        cancelledAt: { $exists: false }
      })

      // There may be the the case where we find an aborted session.
      if (abortedSessionDoc) {
        throw new Meteor.Error('session.start.error', 'session.sessionExists', {
          sessionId: abortedSessionDoc._id,
          unitSetId: unitSetId
        })
      }

      // for a new session we stamp the start time and get the referenced
      // unitSet document in order to store the associated dimension, level and
      // ordered set of units to be solved.
      const startedAt = new Date()
      const unitSetDoc = getUnitSetDoc(unitSetId)

      // if there has no unit been found we need to raise an error
      if (!unitSetDoc) {
        throw new DocumentNotFoundError(UnitSet.name, unitSetId)
      }

      const currentUnit = unitSetDoc.units?.[0]
      if (!currentUnit) {
        throw new Meteor.Error('session.startError', 'session.noUnits')
      }

      const insertDoc = { userId, startedAt, currentUnit }
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
    import { Response } from './Response'

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
    import { UnitSet } from './UnitSet'

    /**
     *
     * @param sessionId
     * @return {any}
     */
    return function ({ sessionId }) {
      const { userId, info } = this
      const sessionDoc = Session.collection().findOne(sessionId)

      if (userId !== sessionDoc.userId) {
        throw new PermissionDeniedError(PermissionDeniedError.NOT_OWNER)
      }

      const { unitSet } = sessionDoc
      const unitSetDoc = UnitSet.helpers.getDocument(unitSet)
      const { currentUnit } = unitSetDoc
      const nextUnit = UnitSet.helpers.getNextUnit(currentUnit, unitSetDoc)
      const update = {}

      if (nextUnit) {
        update.$set = {
          currentUnit: nextUnit
        }
      } else {
        update.$set = {
          currentUnit: null,
          completedAt: new Date()
        }
      }

      info('update session', sessionId, update)
      Session.collection().update(sessionDoc._id, update)
      return Session.collection.findOne(sessionId)
    }
  }),
  call: onClient(function ({ sessionId }, cb) {
    Meteor.call(Session.methods.update.name, { sessionId }, cb)
  })
}

Session.methods.results = {
  name: 'session.methods.results',
  schema: {
    sessionId: String
  },
  numRequests: 1,
  timeInterval: 1000,
  roles: [Role.runSession.value],
  group: Group.field.value,
  run: onServer(function ({ sessionId }) {
    const { userId } = this
    const sessionDoc = Session.collection().findOne(sessionId)
    if (!sessionDoc) throw new Error('docNotFound')
    if (!sessionDoc.completedAt) throw new Error('session.errors.notCompleted')
    const results = SessionsHost.methods.evaluate({ userId, sessionId })
    return { sessionDoc, results }
  }),
  call: onClient(function ({ sessionId }, cb) {
    Meteor.call(Session.methods.results.name, { sessionId }, cb)
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
  roles: [Role.readSessions.value],
  group: Group.team.value,
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

Session.methods.byUnitSet = {
  name: 'session.methods.byUnitSet',
  schema: {
    unitSet: String
  },
  run: onServer(function ({ unitSet }) {
    const { userId } = this

    // TODO maybe add a flag to settings.json with number of days/hours that
    // TODO define a threshold until a session can be continued.
    return Session
      .collection()
      .findOne({
        userId: userId,
        unitSet: unitSet,
        startedAt: { $exists: true },
        completedAt: { $exists: false },
        cancelled: { $exists: false }
      }, {
        hint: { $natural: -1 }
      })
  })
}
