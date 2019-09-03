import settings from '../../../resources/i18n/routes_de' // TODO load dynamically using i18n locale

export const Routes = {}

/**
 * Reroute to notFound route in case an unknown / non-maching url has been detected.
 * @type {{path: (function(): string), label: *, triggersEnter: (function(): *[]), load(), target: null, template: string, roles: null, data: null}}
 */

Routes.fallback = {
  path: () => '*',
  label: 'routes.redirecting',
  triggersEnter: () => [ () => Router.go(Routes.notFound) ],
  load () {},
  target: null,
  template: 'redirecting',
  roles: null,
  data: null
}

/**
 * Renders a default template for all pages that have not been found.
 * @type {{path: (function(): *), label: string, triggersEnter: (function(): *[]), load(), target: null, template: string, roles: null, data: null}}
 */

Routes.notFound = {
  path: () => settings.notFound,
  label: 'routes.notFound',
  triggersEnter: () => [],
  load () {},
  target: null,
  template: 'notFound',
  roles: null,
  data: null
}
