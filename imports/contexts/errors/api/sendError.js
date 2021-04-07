import { Meteor } from 'meteor/meteor'
import { normalizeError } from './normalizeError'
import { callMethod } from '../../../infrastructure/methods/callMethod'
import { Errors } from '../Errors'

// /////////////////////////////////////////////////////////////////////////////
// CLIENT-ONLY
// /////////////////////////////////////////////////////////////////////////////

/**
 * Normalizes an error and sends it to the server for saving.
 * @param error
 * @param userId
 * @param prepare
 * @param receive
 * @param failure
 * @param success
 * @return {*}
 */
export const sendError = ({ error, userId, prepare, receive, failure, success }) => {
  const normalizedError = normalizeError({
    error: error,
    userId: userId || Meteor.userId()
  })

  return callMethod({
    name: Errors.methods.create,
    args: { error: normalizedError },
    prepare: prepare,
    receive: receive,
    failure: failure,
    success: success
  })
}
