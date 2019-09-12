export const Task = {
  name: 'task',
  label: 'task.title',
  icon: 'cube'
}

Task.schema = {
  story: Array,
  'story.$': String,
  stimuli: Array,
  'stimuli.$': Array,
  pages: Array,
  'pages.$': Array,
  'pages.$.$': String
}
