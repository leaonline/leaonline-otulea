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
 * @return {boolean} true/false whether debug is enabled/disabled
 */
export const isDebugUser = (value = undefined) => {
  if (typeof value !== 'undefined') {
    check(value, Boolean)
    const oldValue = debug
    debug = value
    Meteor.call(Users.methods.isDebug.name, { value }, (err, res) => {
      if (err) {
        debug = oldValue
        return console.error(err)
      }

      console.info('[User]: changed debug to ', value, ' success=', !!res)
    })
  }

  return !!(Meteor.user()?.debug || debug)
}
