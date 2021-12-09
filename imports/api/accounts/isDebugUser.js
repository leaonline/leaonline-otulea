import { check } from 'meteor/check'
import { Meteor } from 'meteor/meteor'
import { Users } from '../../contexts/user/User'

let debug = false

/**
 * Returns if the current user has debug mode enabled.
 * Pass a boolean value to optionally set the debug mode.
 *
 * @locus client
 * @param value {Boolean|undefined} set true/false to enable/disable debug mode
 * @param debugFn {Function} optional function for debugging messages
 * @return {boolean} true/false whether debug is enabled/disabled
 */
export const isDebugUser = (value = undefined, debugFn = () => {}) => {
  debug = !!(Meteor.user()?.debug)

  if (typeof value !== 'undefined') {
    check(value, Boolean)

    const oldValue = debug
    debug = value

    Meteor.call(Users.methods.isDebug.name, { value }, (err, res) => {
      if (err) {
        debug = oldValue
        return debugFn(err)
      }

      debugFn('changed debug to ', value, ' success=', !!res)
    })
  }

  return debug
}
