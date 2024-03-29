import { Meteor } from 'meteor/meteor'
import { WebApp } from 'meteor/webapp'
import { createCSPOptions } from '../../infrastructure/csp/cspOptions'
import helmet from 'helmet'

const hostUrls = Object
  .values(Meteor.settings.public.hosts)
  .map(host => host.url)

const cspOptions = createCSPOptions(hostUrls)

// Within server side Meter.startup()
WebApp.connectHandlers.use(helmet(cspOptions))
