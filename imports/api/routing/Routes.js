import settings from '../../../resources/i18n/i18n_routes' // TODO load dynamically using i18n locale
import { createLoggedinTrigger, createLoginTrigger, createNotFoundTrigger } from './triggers'
import { gotoRoute } from './gotoRoute'

export const Routes = {}

/**
 * Renders a default template for all pages that have not been found.
 * @type {{path: (function(): *), label: string, triggersEnter: (function(): *[]), load(), target: null, template:
 *   string, roles: null, data: null}}
 */

Routes.notFound = {
  path: () => `${settings.notFound}`,
  label: 'pages.notFound.title',
  triggersEnter: () => [],
  async load () {
    return import('../../ui/pages/notfound/notFound')
  },
  target: null,
  template: 'notFound',
  data: {
    next () {
      gotoRoute(Routes.overview)
    }
  }
}

/**
 * Reroute to notFound route in case an unknown / non-maching url has been detected.
 * @type {{path: (function(): string), label: *, triggersEnter: (function(): *[]), load(), target: null, template:
 *   string, roles: null, data: null}}
 */

Routes.fallback = {
  path: () => '*',
  label: 'pages.redirecting.title',
  triggersEnter: () => [
    createNotFoundTrigger(Routes.notFound)
  ],
  async load () {
    return import('../../ui/pages/loading/loading')
  },
  target: null,
  template: 'loading',
  data: null
}

Routes.demo = {
  path: () => `${settings.demo}`,
  label: 'pages.welcome.title',
  triggersEnter: () => [function () {
    debugger
    gotoRoute(Routes.welcome, true)
  }],
  load: () => {}
}

/**
 * The starting page of the app
 */
Routes.welcome = {
  path: (isDemo = false) => {
    return isDemo
      ? `${settings.welcome}?demo=1`
      : `${settings.welcome}`
  },
  label: 'pages.welcome.title',
  triggersEnter: () => [],
  async load () {
    return import('../../ui/pages/welcome/welcome')
  },
  target: null,
  template: 'welcome',
  data: {
    next () {
      gotoRoute(Routes.overview)
    }
  }
}

/**
 * Overview page to select dimension and level
 */
Routes.overview = {
  path: () => `${settings.overview}`,
  label: 'pages.overview.title',
  triggersEnter: () => [
    createLoginTrigger(Routes.welcome)
  ],
  async load () {
    return import('../../ui/pages/overview/overview')
  },
  target: null,
  template: 'overview',
  onAction () {
    window.scrollTo(0, 0)
  },
  data: {
    next ({ sessionId, unitId }) {
      gotoRoute(Routes.unit, sessionId, unitId)
    },
    story ({ sessionId, unitSetId, unitId }) {
      gotoRoute(Routes.story, sessionId, unitSetId, unitId)
    }
  }
}

Routes.story = {
  path: (sessionId = ':sessionId', unitSetId = ':unitSetId', unitId = ':unitId') => {
    return `${settings.story}/${sessionId}/${unitSetId}/${unitId}`
  },
  label: 'pages.unit.story',
  triggersEnter: () => [
    createLoginTrigger(Routes.welcome)
  ],
  async load () {
    return import('../../ui/pages/story/story')
  },
  target: null,
  template: 'story',
  onAction () {
    window.scrollTo(0, 0)
  },
  data: {
    next ({ sessionId, unitId }) {
      if (!sessionId) {
        return gotoRoute(Routes.overview)
      }

      return (!unitId)
        ? gotoRoute(Routes.complete, sessionId)
        : gotoRoute(Routes.unit, sessionId, unitId)
    },
    exit () {
      gotoRoute(Routes.overview)
    }
  }
}
/**
 * Unit process page, where all units are dynamically rendered and processed.
 */

Routes.unit = {
  path: (sessionId = ':sessionId', unitId = ':unitId') => {
    return `${settings.unit}/${sessionId}/${unitId}`
  },
  label: 'pages.unit.title',
  triggersEnter: () => [
    createLoginTrigger(Routes.welcome)
  ],
  async load () {
    return import('../../ui/pages/unit/unit')
  },
  target: null,
  template: 'unit',
  onAction () {
    window.scrollTo(0, 0)
  },
  data: {
    next ({ sessionId, unitId, unitSetId, hasStory, completed }) {
      if (!sessionId) {
        return gotoRoute(Routes.overview)
      }

      // if we have entered a new unitSet and the unitSet is flagged with
      // having a story, then we need to transit to the story page first
      if (unitSetId && hasStory) {
        return gotoRoute(Routes.story, sessionId, unitSetId, unitId)
      }

      return (!unitId || completed)
        ? gotoRoute(Routes.complete, sessionId)
        : gotoRoute(Routes.unit, sessionId, unitId)
    },
    exit () {
      gotoRoute(Routes.overview)
    },
    finish ({ sessionId }) {
      return sessionId
        ? gotoRoute(Routes.complete, sessionId)
        : gotoRoute(Routes.overview)
    }
  }
}

Routes.complete = {
  path: (sessionId = ':sessionId') => {
    const path = `${settings.complete}/${sessionId}`
    console.log(path)
    return path
  },
  label: 'pages.complete.title',
  triggersEnter: () => [
    createLoginTrigger(Routes.welcome)
  ],
  async load () {
    return import('../../ui/pages/complete/complete')
  },
  target: null,
  template: 'complete',
  onAction () {
    window.scrollTo(0, 0)
  },
  data: {
    end () {
      gotoRoute(Routes.logout)
    },
    next () {
      gotoRoute(Routes.overview)
    },
    exit () {
      gotoRoute(Routes.logout)
    }
  }
}

Routes.logout = {
  path: () => {
    return `${settings.logout}`
  },
  label: 'pages.logout.title',
  triggersEnter: () => [],
  async load () {
    return import('../../ui/pages/logout/logout')
  },
  target: null,
  template: 'logout',
  onAction () {
    window.scrollTo(0, 0)
  },
  data: {
    next () {
      return Routes.overview
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
  label: 'pages.redirecting.title',
  triggersEnter: () => [
    createLoginTrigger(Routes.welcome),
    createLoggedinTrigger(Routes.overview)
  ],
  async load () {
    return import('../../ui/pages/loading/loading')
  },
  target: null,
  template: 'loading',
  data: null
}

Object.keys(Routes).forEach(key => {
  Routes[key].key = key
})
