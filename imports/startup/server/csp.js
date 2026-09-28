import { Meteor } from 'meteor/meteor'
import { configureCSP } from './configureCSP'

Meteor.startup(async () => {
  // Keep Meteor's runtime configuration out of inline script tags. This lets
  // script-src continue to block arbitrary inline JavaScript without relying
  // on hashes reconstructed from Meteor's private, mutable runtime state.
  const hostUrls = Object.values(Meteor.settings.public.hosts).map(
    (host) => host.url,
  )
  await configureCSP({ hostUrls })
})
