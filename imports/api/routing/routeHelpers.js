import settings from '../../../resources/i18n/routes_de' // TODO load dynamically using i18n locale

export const resolveRoute = function resolve (key, ...optionalArgs) {
  const route = Routes[ key ]
  if (!route) {
    return settings.notFound
  }
  return route && route.path(...optionalArgs)
}
