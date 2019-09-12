import { getCollection } from '../../utils/collectionuUtils'

export const TaskSet = {
  name: 'taskSet',
  label: 'taskSet.label',
  icon: 'cubes'
}

TaskSet.schema = {
  startedAt: Date,
  completedAt: Date,
  tasks: Array,
  'tasks.$': String
}

TaskSet.helpers = {
  getInitialSet ({ dimension, level }) {
    const TaskSetCollection = getCollection(TaskSet)
    const taskId = TaskSetCollection.findOne()._id
    return [ taskId ]
  }
}
