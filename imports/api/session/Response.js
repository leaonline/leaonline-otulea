import { Role } from '../accounts/Role'
import { Group } from '../accounts/Group'
import { onClient, onServer } from '../../utils/archUtils'

export const Response = {
  name: 'response',
  label: 'repsonse.title',
  icon: 'pencil'
}

Response.schema = {
  sessionId: String,
  taskId: String,
  startedAt: String,
  completedAt: String,
  answers: Array,
  'answers.$:': Object,
  'answers.$.interactionId:': String,
  'answers.$.value:': String
}

Response.methods = {}

Response.methods.send = {
  name: 'response.methods.send',
  schema: {
    sessionId: String,
    taskId: String,
    answers: Response.schema.answers
  },
  roles: [Role.runSession.value, Role.test.value],
  group: Group.field.value,
  numRequests: 1,
  timeInterval: 1000,
  run: onServer(function ({ sessionId, taskId, answers }) {

  }),
  call: onClient(function ({ sessionId, taskId, answers }, cb) {
    Meteor.call(Response.methods.send.name, {sessionId, taskId, answers }, cb)
  })
}