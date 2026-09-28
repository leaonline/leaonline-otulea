import { WebApp, WebAppInternals } from 'meteor/webapp'
import helmet from 'helmet'
import { createCSPOptions } from '../../infrastructure/csp/cspOptions'

export const configureCSP = async ({
  hostUrls,
  setInlineScriptsAllowed = WebAppInternals.setInlineScriptsAllowed,
  useMiddleware = (middleware) => WebApp.handlers.use(middleware),
  createMiddleware = helmet,
} = {}) => {
  await setInlineScriptsAllowed(false)
  const options = createCSPOptions(hostUrls)
  useMiddleware(createMiddleware(options))
  return options
}
