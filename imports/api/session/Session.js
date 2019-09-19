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
  userId: String,
  startedAt: Date,
  completedAt: {
    type: Date,
    optional: true
  },
  dimension: String,
  level: String,
  sets: Array,
  'sets.$': String,
  currentSet: {
    type: Number,
    defaultValue: 0
  },
  currentTask: {
    type: Number,
    defaultValue: 0
  },
  progress: {
    type: Number
  },
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
  getProgress({ currentTask, tasks }) {
    return Math.floor(100 * (currentTask / tasks.length))
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
      const cancelledSession = SessionCollection.findOne({ userId, completedAt: { $exists: false } })
      if (cancelledSession) {
        const currentSetId = cancelledSession.sets[ cancelledSession.currentSet ]
        const currentSetDoc = TaskSet.collection().findOne(currentSetId)
        return currentSetDoc.tasks[ cancelledSession.currentTask ]
      }
    }

    const startedAt = new Date()
    const initialTasksDoc = TaskSet.helpers.getInitialSet({ dimension, level })
    const progress = Session.helpers.getProgress({ currentTask: 1, tasks: initialTasksDoc.tasks })
    const sets = []
    sets.push(initialTasksDoc._id)

    const insertDoc = { userId, startedAt, dimension, level, sets, progress }
    const newSessionId = SessionCollection.insert(insertDoc)
    return newSessionId && initialTasksDoc.tasks[ 0 ]
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

    const currentTask = sessionDoc.currentTask
    const currentSetId = sessionDoc.sets[sessionDoc.currentSet]
    const currentSetDoc = TaskSet.collection().findOne(currentSetId)
    let nextTaskId = currentSetDoc.tasks[currentTask + 1]
    const update = { $addToSet: { response: responseId }}



    if (nextTaskId) {
      console.log(currentSetDoc.tasks, nextTaskId, currentSetDoc.tasks[currentTask])
      update.$set = {}
      update.$set.currentTask = currentTask + 1
      update.$set.progress = Session.helpers.getProgress({ currentTask: 1, tasks: currentSetDoc.tasks })
      Session.collection().update(currentSetId, update)
      return nextTaskId
    }

    const nextSetId = sessionDoc.sets[sessionDoc.currentSet + 1]
    console.log(currentSetId, nextSetId, sessionDoc.sets)
    if (nextSetId) {
      const nextSet = TaskSet.collection().findOne(nextSetId)
      update.$set = {}
      update.$set.currentSet= sessionDoc.currentSet + 1
      update.$set.currentTask = 0
      update.progress = Session.helpers.getProgress({ currentTask: 1, tasks: nextSet.tasks })
      nextTaskId = nextSet.tasks[0]
      Session.collection().update(currentSetId, update)
      return nextTaskId
    }

    update.completedAt = new Date()
    Session.collection().update(currentSetId, update)
    return null
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