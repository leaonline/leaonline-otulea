import { Meteor } from 'meteor/meteor'
import { Tracker } from 'meteor/tracker'
import './minimal.scss'

Meteor.startup(() => {
  setTimeout(async () => {
    const popper = (await import('popper.js')).default
    global.Popper = global.Popper || popper
  }, 1000)

  // if the user is logged in we can load the full scss, since until then
  // the service worker will have most of the
  Tracker.autorun(async function (computation) {
    if (Meteor.userId()) {
      await import('./theme.scss')
      computation.stop()
    }
  })
})
