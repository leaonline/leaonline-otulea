import { Uptime } from 'meteor/leaonline:uptime'

Uptime.init({
  path: Meteor.settings.uptime.path,
})
