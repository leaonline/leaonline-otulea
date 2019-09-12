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
    // TODO implement with real data
    const result = []
    result.length = 3
    let i
    for (i = 0; i < 3; i++) {
      result[i] = `${dimension}.${level}.${i + 1}`
    }
    return result
  }
}
