import { Users } from './User'

let debug = false

export const isDebugUser = value => {
  if (typeof value !== 'undefined') {
    debug = !!value
    Meteor.call(Users.methods.isDebug.name, { value }, (err, res) => {
      if (err) return console.error(err)
      console.info('[User]: chaged debbug to ', value, ' success=', !!res)
    })
  }

  return Meteor.user()?.debug || debug
}
