import { Meteor } from 'meteor/meteor'
import { Session } from '../../contexts/session/Session'
import { Response } from '../../contexts/response/Response'

/**
 * Removes a given user plus all her associated sessions and responses.
 * @param userId {String}
 * @param calledBy {String}
 * @param debug {Function}
 * @return {{responsesRemoved: Number, sessionsRemoved: Number, userRemoved: Number}}
 */
export const removeUser = function (userId, calledBy, debug = () => {}) {
  debug(removeUser.name, { userId, calledBy })
  const user = Meteor.users.findOne(userId)

  if (!user) {
    throw new Meteor.Error('removeUser.error', 'removeUser.userDoesNotExist', {
      userId,
      calledBy
    })
  }

  const responsesRemoved = Response.collection().remove({ userId })
  const sessionsRemoved = Session.collection().remove({ userId })
  const userRemoved = Meteor.users.remove({ _id: userId })

  return {
    responsesRemoved,
    sessionsRemoved,
    userRemoved
  }
}
