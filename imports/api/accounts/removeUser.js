import { Session } from '../../contexts/session/Session'
import { Response } from '../../contexts/response/Response'
import { createLog } from '../../utils/createLog'

/**
 * Removes a given user plus all her associated sessions and responses.
 * @param userId {String}
 * @return {{responsesRemoved: Number, sessionsRemoved: Number, userRemoved: Number}}
 */
export const removeUser = function (userId, calledBy) {
  debug({ userId, calledBy })
  const user = Meteor.users.findOne(userId)

  if (!user) {
    throw new Meteor.Error('removeUser.error', 'removeUser.userDoesNotExist', { userId })
  }

  const responsesRemoved = Response.collection().remove({ userId })
  const sessionsRemoved = Session.collection().remove({ userId })
  const userRemoved = Meteor.users.remove({ _id: userId })
  const result = {
    responsesRemoved,
    sessionsRemoved,
    userRemoved
  }
  debug(result)
  return result
}

const debug = createLog({
  name: removeUser.name,
  type: 'debug',
  devOnly: false
})
