import { Meteor } from 'meteor/meteor'
import { Email } from 'meteor/email'

export const notifyUsersAboutError = (error) => {
  if (!Meteor.isServer) {
    return Promise.resolve(console.error('Expected server env'))
  }

  const appName = Meteor.settings.public.app.name
  const { notify, replyTo, from } = Meteor.settings.email
  if (!notify?.length || !error) return Promise.resolve()

  return Promise.all([
    notify.map((address) => {
      return Email.sendAsync({
        to: address,
        subject: `${appName} [error]: ${error.message}`,
        replyTo: replyTo,
        from: from,
        text: JSON.stringify(error, null, 2),
      })
    }),
  ])
}
