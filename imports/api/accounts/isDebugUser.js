import { check } from 'meteor/check'
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
export const isDebugUser = value => {
  if (typeof value !== 'undefined') {
    check(value,  Boolean)
    Meteor.call(Users.methods.isDebug.name, { value }, (err, res) => {
      if (err) return console.error(err)
      console.info('[User]: chaged debbug to ', value, ' success=', !!res)
    })
  }

  return !!(Meteor.user()?.debug || debug)
}
