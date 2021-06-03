import { Meteor } from 'meteor/meteor'
import { Email } from 'meteor/email'

const appName = Meteor.settings.public.app.label
const { notify, replyTo, from, headers } = Meteor.settings.email

export const notifyUsersAboutError = error => {
  if (!notify?.length || !error) return

  notify.forEach(address => {
    Email.send({
      to: address,
      subject: `${appName} [error]: ${error.type} - ${error.name}`,
      replyTo: replyTo,
      from: from,
      text: `<pre><code>${JSON.stringify(error, null, 2)}</code></pre>`
    })
  })
}
