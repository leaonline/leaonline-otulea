import { getCollection } from '../../utils/collectionuUtils'

export const Task = {
  name: 'task',
  label: 'task.title',
  icon: 'cube'
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
  load (taskId) {
    // TODO HTTP GET from content server
    return Task.collection().findOne(taskId)
  }
}
