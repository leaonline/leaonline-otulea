import { getCollection } from '../../utils/collectionuUtils'
import { Role } from '../accounts/Role'
import { Group } from '../accounts/Group'
import { onClient, onServer } from '../../utils/archUtils'

export const Task = {
  name: 'task',
  label: 'task.title',
  icon: 'cube',
  methods: {},
  publications: {}
}

Task.schema = {
  taskId: String,
  dimension: String,
  level: String,
  story: Array,
  'story.$': {
    type: Object,
    blackbox: true
  },
  stimuli: Array,
  'stimuli.$': {
    type: Object,
    blackbox: true
  },
  pages: Array,
  'pages.$': Array,
  'pages.$.$': {
    type: Object,
    blackbox: true
  }
}

let _TaskCollection
Task.collection = function () {
  if (!_TaskCollection) {
    _TaskCollection = getCollection(Task)
  }
  return _TaskCollection
}

Task.helpers = {
  load (taskId, cb) {
    // TODO HTTP GET from content server
    Task.methods.load.call({ taskId }, cb)
  }
}

Task.methods.load = {
  name: 'task.methods.load',
  schema: {
    taskId: String
  },
  roles: [ Role.runSession.value, Role.test.value ],
  group: Group.field.value,
  numRequests: 1,
  timeInterval: 1000,
  run: onServer(function ({ taskId }) {
    return Task.collection().findOne(taskId)
  }),
  call: onClient(function ({ taskId }, cb) {
    Meteor.call(Task.methods.load.name, { taskId }, cb)
  })
}