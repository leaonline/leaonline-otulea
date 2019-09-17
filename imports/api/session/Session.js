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
  roles: [ Role.runSession.value ],
  group: Group.field.value,
  run: onServer(function ({ dimension, level, restart }) {
    const { userId } = this
    const SessionCollection = Session.collection()

    if (!restart) {
      const cancelledSession = SessionCollection.findOne({ userId, completedAt: { $exists: false } })
      if (cancelledSession) {
        return cancelledSession
      }
    }

    const startedAt = new Date()
    const initialTasksDoc = TaskSet.helpers.getInitialSet({ dimension, level })
    const sets = []
    sets.push(initialTasksDoc._id)

    const responses = []
    const insertDoc = { userId, startedAt, dimension, level, sets }
    const newSessionId = SessionCollection.insert(insertDoc)
    console.log(initialTasksDoc)
    return newSessionId && initialTasksDoc.tasks[ 0 ]
  }),
  call: onClient(function ({ dimension, level, restart }, cb) {
    Meteor.call(Session.methods.start.name, { dimension, level, restart }, cb)
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
    return Session.collection().find({
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