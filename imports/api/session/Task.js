import exampleTask from '../../../resources/lea/exampleTasks'

export const Task = {
  name: 'task',
  label: 'task.title',
  icon: 'cube'
}

Task.schema = {
  taskId: String,
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

Task.helpers = {
  load (taskId) {
    // TODO HTTP GET from content server
    return exampleTask[taskId]
  }
}
