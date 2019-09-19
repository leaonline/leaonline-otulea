import { check } from 'meteor/check'
import { Role } from '../accounts/Role'
import { Group } from '../accounts/Group'
import { onClient, onServer } from '../../utils/archUtils'
import { getCollection } from '../../utils/collectionuUtils'
import { TaskSet } from './TaskSet'

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
  'responses.$': String
}

Session.helpers = {
  current ({ dimension, level } = {}) {
    check(dimension, String)
    check(level, String)
    return Session.collection().findOne({ dimension, level })
  },
  getProgress ({ currentTask, tasks }) {
    const index = tasks.indexOf(currentTask) + 1
    return Math.floor(100 * (index / tasks.length))
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
    restart: {
      type: Boolean,
      optional: true
    }
  },
  numRequests: 1,
  timeInterval: 1000,
  roles: [ Role.runSession.value, Role.test.value ],
  group: Group.field.value,
  run: onServer(function ({ dimension, level, restart }) {
    const { userId } = this
    const SessionCollection = Session.collection()

    if (!restart) {
      const cancelledSession = SessionCollection.findOne({ userId, dimension, level, completedAt: { $exists: false } })
      if (cancelledSession) {
        return cancelledSession.currentTask
      }
    }

    const startedAt = new Date()
    const initialTasksDoc = TaskSet.helpers.getInitialSet({ dimension, level })
    const { tasks } = initialTasksDoc
    const currentTask = Session.helpers.getNextTask({ tasks })

    const insertDoc = { userId, startedAt, dimension, level, tasks, currentTask }
    const newSessionId = SessionCollection.insert(insertDoc)
    return newSessionId && currentTask
  }),
  call: onClient(function ({ dimension, level, restart }, cb) {
    Meteor.call(Session.methods.start.name, { dimension, level, restart }, cb)
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
      throw new Error('errors.permissionDenied', 'errors.notOwner')
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

Session.methods.complete = {
  name: 'session.complete',
  schema: {
    sessionId: String
  },
  numRequests: 1,
  timeInterval: 1000,
  roles: [ Role.runSession.value ],
  group: Group.field.value,
  run: onServer(function ({ sessionId }) {
    throw new Error('not implemented')
  }),
  call: onClient(function ({ sessionId }) {
    throw new Error('not implemented')
  })
}

Session.methods.cancel = {
  name: 'session.cancel',
  schema: {
    sessionId: String
  },
  numRequests: 1,
  timeInterval: 1000,
  roles: [ Role.runSession.value ],
  group: Group.field.value,
  run: onServer(function ({ sessionId }) {
    throw new Error('not implemented')
  }),
  call: onClient(function ({ sessionId }) {
    throw new Error('not implemented')
  })
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
      startedAt: { $exists: true },
      completedAt: { $exists: false }
    }, {
      sort: { startedAt: -1 }
    })
  }),
  subscribe: onClient(function () {
    import { SubsManager } from '../subscriptions/SubsManager'
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