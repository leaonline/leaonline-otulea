import { getCollection } from '../../utils/collectionuUtils'

export const TaskSet = {
  name: 'taskSet',
  label: 'taskSet.label',
  icon: 'cubes'
}

TaskSet.schema = {
  dimension: String,
  level: String,
  tasks: Array,
  'tasks.$': String
}

let _TaskSetCollection
TaskSet.collection = function () {
  if (!_TaskSetCollection) {
    _TaskSetCollection = getCollection(TaskSet)
  }
  return _TaskSetCollection
}

TaskSet.helpers = {
  getInitialSet ({ dimension, level }) {
    return TaskSet.collection().findOne() // fixme use dimension and level when all tasks are supported
  }
}
