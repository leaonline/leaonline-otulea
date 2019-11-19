import { Meteor } from 'meteor/meteor'
import { check, Match } from 'meteor/check'
import { Role } from '../accounts/Role'
import { Group } from '../accounts/Group'
import { onClient, onServer } from '../../utils/archUtils'
import { getCollection } from '../../utils/collectionuUtils'
import { TaskSet } from './TaskSet'
import { PermissionDeniedError } from '../errors/PermissionDenied'
import { SubsManager } from '../subscriptions/SubsManager'

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
  completedAt: {
    type: Date,
    optional: true
  },

  /**
   * The related dimension and level of the current session.
   */
  dimension: String,
  level: String,

  /**
   * A list of task documents to load and a reference to
   * the current task by id.
   */

  tasks: Array,
  'tasks.$': String,
  currentTask: String,

  /**
   * References to response documents. Initially empty
   */

  responses: {
    type: Array,
    optional: true
  },
  'responses.$': String,

  /**
   * Optional entry to flag a session, that has been superseeded by a "restart"
   */
  cancelled: {
    type: Boolean,
    optional: true
  }
}

Session.helpers = {
  current ({ dimension, level, completedAt = { $exists: false } } = {}) {
    check(dimension, Match.Maybe(String))
    check(level, Match.Maybe(String))
    return Session.collection().findOne({ dimension, level, completedAt }, { sort: { statedAt: -1 } })
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
      return tasks[ 0 ]
    }
    const index = tasks.indexOf(currentTask)
    if (index === -1 || index >= tasks.length - 1) {
      return
    }
    return tasks[ index + 1 ]
  }
}

Session.methods.start = {
  name: 'session.start',
  schema: {
    dimension: String,
    level: String,
    continueAborted: {
      type: Boolean,
      optional: true
    }
  },
  numRequests: 1,
  timeInterval: 1000,
  roles: [ Role.runSession.value, Role.test.value ],
  group: Group.field.value,
  run: onServer(function ({ dimension, level, continueAborted }) {
    const { userId } = this
    const SessionCollection = Session.collection()

    const abortedSession = SessionCollection.findOne({ userId, dimension, level, completedAt: { $exists: false } })
    if (abortedSession) {
      if (continueAborted) {
        return { sessionId: abortedSession._id, taskId: abortedSession.currentTask }
      } else {
        SessionCollection.update(abortedSession._id, { $set: { cancelled: true } })
      }
    }

    const startedAt = new Date()
    const initialTasksDoc = TaskSet.helpers.getInitialSet({ dimension, level })
    if (!initialTasksDoc) {
      throw new Error('Expected a taskSet document to exist')
    }

    const { tasks } = initialTasksDoc
    const currentTask = Session.helpers.getNextTask({ tasks })

    const insertDoc = { userId, startedAt, dimension, level, tasks, currentTask }
    const newSessionId = SessionCollection.insert(insertDoc)
    return newSessionId && currentTask && { sessionId: newSessionId, taskId: currentTask }
  }),
  call: onClient(function ({ dimension, level, continueAborted }, cb) {
    Meteor.call(Session.methods.start.name, { dimension, level, continueAborted }, cb)
  })
}

Session.methods.update = {
  name: 'session.methods.update',
  schema: {
    sessionId: String,
    responseId: String
  },
  numRequests: 1,
  timeInterval: 1000,
  roles: [ Role.runSession.value ],
  group: Group.field.value,
  run: onServer(function ({ sessionId, responseId }) {
    const { userId } = this
    const sessionDoc = Session.collection().findOne(sessionId)

    if (userId !== sessionDoc.userId) {
      throw new PermissionDeniedError(PermissionDeniedError.NOT_OWNER)
    }

    const nextTask = Session.helpers.getNextTask(sessionDoc)
    const update = {
      $addToSet: {
        response: responseId
      },
      $set: {}
    }

    if (nextTask) {
      update.$set.currentTask = nextTask
    } else {
      update.$set.completedAt = new Date()
    }

    Session.collection().update(sessionDoc._id, update)
    return nextTask
  }),
  call: onClient(function ({ sessionId, responseId }, cb) {
    Meteor.call(Session.methods.update.name, { sessionId, responseId }, cb)
  })
}


const sessionCredential = Meteor.settings.sessionCredential
const evalUrl = Meteor.settings.public.hosts.sessions.evalUrl

Session.methods.results = {
  name: 'session.methods.results',
  schema: {
    sessionId: String
  },
  numRequests: 1,
  timeInterval: 1000,
  roles: [ Role.runSession.value ],
  group: Group.field.value,
  run: onServer(function ({ sessionId }) {
    const { userId } = this
    const sessionDoc = Session.collection().findOne(sessionId)
    if (!sessionDoc) throw new Error('docNotFound')
    if (!sessionDoc.completedAt) throw new Error('session.errors.notCompleted')

    console.log(sessionDoc)
    const results = HTTP.post(evalUrl, {
      data: { sessionId, userId },
      headers: {
        'X-Auth-Token': sessionCredential
      }
    })

    return { sessionDoc, results: results && results.content }
  }),
  call: onClient(function ({ sessionId }, cb) {
    // TODO replace later with POST request to eval server
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
  roles: [ Role.readSessions.value ],
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

Session.publications.current = {
  name: 'session.publications.current',
  schema: {},
  projection: {},
  numRequests: 1,
  timeInterval: 1000,
  roles: [ Role.runSession.value ],
  group: Group.field.value,
  run: onServer(function () {
    const { userId } = this
    return Session.collection().find({
      userId: userId,
      startedAt: {
        $exists: true
      },
      completedAt: {
        $exists: false
      },
      cancelled: {
        $exists: false
      }
    }, {
      sort: { startedAt: -1 }
    })
  }),
  subscribe: onClient(function () {
    return SubsManager.subscribe(Session.publications.current.name)
  })
}

let _collection

Session.collection = function () {
  if (!_collection) {
    _collection = getCollection(Session)
  }
  return _collection
}
