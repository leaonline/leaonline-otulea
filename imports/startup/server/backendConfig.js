import { Meteor } from 'meteor/meteor'
import { BackendConfig } from '../../api/config/BackendConfig'
import { createMethods } from '../../factories/method/createMethods'
import { rateLimitMethods } from '../../factories/ratelimit/rateLimit'
import de from '../../../resources/i18n/i18n_backend_de'

const { app } = Meteor.settings.public

BackendConfig.init(app)
BackendConfig.addLang('de', de)

const methods = Object.values(BackendConfig.methods)
createMethods(methods)
rateLimitMethods(methods)
