import { Meteor } from 'meteor/meteor'

Meteor.startup(async () => {
  await import('bootstrap')
  const popper = (await import('popper.js')).default
  global.Popper = global.Popper || popper
  await import('./theme.scss')
})


