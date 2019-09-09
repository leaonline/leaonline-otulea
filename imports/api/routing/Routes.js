import settings from '../../../resources/i18n/i18n_routes' // TODO load dynamically using i18n locale
import { createLoggedinTrigger, createLoginTrigger, createNotFoundTrigger } from './triggers'

export const Routes = {}

/**
 * Renders a default template for all pages that have not been found.
 * @type {{path: (function(): *), label: string, triggersEnter: (function(): *[]), load(), target: null, template:
 *   string, roles: null, data: null}}
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
 * Reroute to notFound route in case an unknown / non-maching url has been detected.
 * @type {{path: (function(): string), label: *, triggersEnter: (function(): *[]), load(), target: null, template:
 *   string, roles: null, data: null}}
 */

Routes.fallback = {
  path: () => '*',
  label: 'routes.redirecting',
  triggersEnter: () => [
    createNotFoundTrigger(Routes.notFound)
  ],
  async load () {
    return true
  },
  target: null,
  template: 'loading',
  roles: null,
  data: null
}

/**
 * The starting page of the app, that contains an
 * @type {{path: (function(): string), label: string, triggersEnter: (function(): *[]), load(): Promise<undefined>,
 *   target: null, template: null, roles: null, data: null}}
 */
Routes.welcome = {
  path: () => `${settings.welcome}`,
  label: 'routes.welcome',
  triggersEnter: () => [],
  async load () {
    return import('../../ui/pages/welcome/welcome')
  },
  target: null,
  template: 'welcome',
  roles: null,
  data: {
    next () {
      return Routes.overview
    }
  }
}

Routes.overview = {
  path: () => `${settings.overview}`,
  label: 'routes.overview',
  triggersEnter: () => [
    createLoginTrigger(Routes.welcome),
  ],
  async load () {
    return import('../../ui/pages/overview/overview')
  },
  target: null,
  template: 'overview',
  roles: null,
  onAction () {
    window.scrollTo(0, 0)
  },
  data: {
    next () {
      throw new Error('not yet implemented')
    }
  }
}

/**
 * The default route to be used when landing on the page without params
 * @type {{path: (function(): string), label: string, triggersEnter: (function(): *[]), load(): Promise<undefined>,
 *   target: null, template: null, roles: null, data: null}}
 */
Routes.root = {
  path: () => '/',
  label: 'routes.redirecting',
  triggersEnter: () => [
    createLoginTrigger(Routes.welcome),
    createLoggedinTrigger(Routes.overview)
  ],
  async load () {
    return true
  },
  target: null,
  template: 'loading',
  roles: null,
  data: null
}

Object.keys(Routes).forEach(key => {
  Routes[ key ].key = key
})
