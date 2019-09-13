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
  completedAt: Date,
  dimension: String,
  level: String,
  sets: Array,
  'sets.$': String,
  responses: {
    type: Array,
    optional: true
  },
  'responses.$': String
}

Session.helpers = {
  current () {
    return Session.collection().findOne()
  }
}

Session.methods.start = {
  name: 'session.start',
  schema: {
    dimension: String,
    level: String
  },
  numRequests: 1,
  timeInterval: 1000,
  roles: [ Role.runSession.value ],
  group: Group.field.value,
  run: onServer(function ({ dimension, level }) {
    import { TaskSet } from './TaskSet'

    const { userId } = this
    const SessionCollection = Session.collection()
    const cancelledSession = SessionCollection.findOne({ userId, completedAt: { $exists: false } })

    if (cancelledSession) {
      return cancelledSession
    }

    const startedAt = new Date()
    const sets = TaskSet.helpers.getInitialSet({ dimension, level })
    const responses = []
    const insertDoc = { userId, startedAt, dimension, level, sets }
    const newSessionId = SessionCollection.insert(insertDoc)

    return SessionCollection.findOne(newSessionId)
  }),
  call: onClient(function ({ dimension, level }, cb) {
    Meteor.call(Session.methods.start.name, { dimension, level }, cb)
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
    return Session.collection().find({ startedAt: { $exists: true }, completedAt: { $exists: false } })
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