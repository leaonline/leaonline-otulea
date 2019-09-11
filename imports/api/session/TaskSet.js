export const TaskSet = {
  name: 'taskSet',
  label: 'taskSet.label',
  icon: 'cubes',
  schema: {
    startedAt: Date,
    completedAt: Date,
    tasks: Array,
    'tasks.$': String
  }
}
