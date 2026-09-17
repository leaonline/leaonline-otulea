import { Meteor } from 'meteor/meteor'
import { WebApp, WebAppInternals } from 'meteor/webapp'
import { createCSPOptions } from '../../infrastructure/csp/cspOptions'
import helmet from 'helmet'

const hostUrls = Object.values(Meteor.settings.public.hosts).map(
  (host) => host.url,
)

Meteor.startup(async () => {
  // Keep Meteor's runtime configuration out of inline script tags. This lets
  // script-src continue to block arbitrary inline JavaScript without relying
  // on hashes reconstructed from Meteor's private, mutable runtime state.
  await WebAppInternals.setInlineScriptsAllowed(false)

  WebApp.handlers.use(helmet(createCSPOptions(hostUrls)))
})
