export const Response = {
  name: 'response',
  label: 'repsonse.title',
  icon: 'pencil'
}

Response.schema = {
  taskId: String,
  startedAt: String,
  completedAt: String,
  answers: Array,
  'answers.$:': Object,
  'answers.$.interactionId:': String,
  'answers.$.value:': String,
}