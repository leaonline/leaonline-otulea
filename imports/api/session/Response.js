import { Session } from './Session'
import { Role } from '../accounts/Role'
import { Group } from '../accounts/Group'
import { onClient, onServer } from '../../utils/archUtils'
import { getCollection } from '../../utils/collectionuUtils'

export const Response = {
  name: 'response',
  label: 'repsonse.title',
  icon: 'pencil'
}

Response.schema = {
  userId: String,
  sessionId: String,
  taskId: String,
  startedAt: String,
  completedAt: String,
  answers: {
    type: Array,
    optional: true
  },
  'answers.$': Object,
  'answers.$.interactionId': String,
  'answers.$.value': String
}


let _ResponseCollection

Response.collection = function () {
  if (!_ResponseCollection) {
    _ResponseCollection = getCollection(Response)
  }
  return _ResponseCollection
}

Response.methods = {}

Response.methods.send = {
  name: 'response.methods.send',
  schema: {
    sessionId: String,
    taskId: String,
    answers: {
      type: Array,
      optional: true
    },
    'answers.$': Object,
    'answers.$.interactionId': String,
    'answers.$.value': String
  },
  roles: [Role.runSession.value, Role.test.value],
  group: Group.field.value,
  numRequests: 1,
  timeInterval: 1000,
  run: onServer(function ({ sessionId, taskId, answers }) {
    const {userId} = this
    const sessionDoc = Session.collection().findOne(sessionId)
    if (userId !== sessionDoc.userId) {
      throw new Error('erros.permissionDenied', 'errors.notOwner')
    }

    const existingResponse = Response.collection().findOne({sessionId, taskId, userId})
    if (existingResponse) {
      // TODO should we check for a diff in the answers prop and update?
      return existingResponse._id
    }

    const { startedAt } = sessionDoc
    const completedAt = new Date()

    return Response.collection().insert({ userId, sessionId, taskId, answers, startedAt, completedAt })
  }),
  call: onClient(function ({ sessionId, taskId, answers }, cb) {
    Meteor.call(Response.methods.send.name, {sessionId, taskId, answers }, cb)
  })
}
