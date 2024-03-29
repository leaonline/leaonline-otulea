import { Meteor } from 'meteor/meteor'
import { Email } from 'meteor/email'

const appName = Meteor.settings.public.app.name
const { notify, replyTo, from } = Meteor.settings.email

export const notifyUsersAboutError = error => {
  if (!notify?.length || !error) return

  notify.forEach(address => {
    Email.send({
      to: address,
      subject: `${appName} [error]: ${error.message}`,
      replyTo: replyTo,
      from: from,
      text: JSON.stringify(error, null, 2)
    })
  })
}
