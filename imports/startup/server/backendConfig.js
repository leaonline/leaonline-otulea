import { Meteor } from 'meteor/meteor'
import { ServiceRegistry } from '../../api/config/BackendConfig'
import { createMethods } from '../../factories/method/createMethods'
import { rateLimitMethods } from '../../factories/ratelimit/rateLimit'
import de from '../../../resources/i18n/i18n_backend_de'

const { app } = Meteor.settings.public

ServiceRegistry.init(app)
ServiceRegistry.addLang('de', de)

const methods = Object.values(ServiceRegistry.methods)
createMethods(methods)
rateLimitMethods(methods)
