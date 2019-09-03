import settings from '../../../resources/i18n/routes_de' // TODO load dynamically using i18n locale
import { createNotFoundTrigger } from './triggers'

export const Routes = {}

/**
 * Renders a default template for all pages that have not been found.
 * @type {{path: (function(): *), label: string, triggersEnter: (function(): *[]), load(), target: null, template: string, roles: null, data: null}}
 */

Routes.notFound = {
  path: () => `${settings.notFound}`,
  label: 'routes.notFound',
  triggersEnter: () => [],
  async load () {
    return import('../../ui/pages/notfound/notFound')
  },
  target: null,
  template: 'notFound',
  roles: null,
  data: null
}

/**
 * @private
 */

const notFoundTrigger = createNotFoundTrigger(Routes.notFound)

/**
 * Reroute to notFound route in case an unknown / non-maching url has been detected.
 * @type {{path: (function(): string), label: *, triggersEnter: (function(): *[]), load(), target: null, template: string, roles: null, data: null}}
 */

Routes.fallback = {
  path: () => '*',
  label: 'routes.redirecting',
  triggersEnter: () => [ notFoundTrigger ],
  async load () {
    return
  },
  target: null,
  template: null,
  roles: null,
  data: null
}

Object.keys(Routes).forEach(key => {
  Routes[key].key = key
})
