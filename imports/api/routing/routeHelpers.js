import { Routes } from './Routes'
import settings from '../../../resources/i18n/i18n_routes' // TODO load dynamically using i18n locale

export const resolveRoute = function resolve (key, ...optionalArgs) {
  const route = Routes[ key ]
  if (!route) {
    return settings.notFound
  }
  return route && route.path(...optionalArgs)
}
