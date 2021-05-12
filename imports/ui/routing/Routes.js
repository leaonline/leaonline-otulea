import { createTrigger } from './triggers'
import { loggedIn, loggedOut } from '../../utils/accountUtils'

export const Routes = {}

const go = (...args) => {
  import { gotoRoute } from './gotoRoute'
  gotoRoute(...args)
}

const settings = () => {
  // TODO load dynamically using i18n locale
  import settingsFile from '../../../resources/i18n/i18n_routes'
  return settingsFile
}

/**
 * Renders a default template for all pages that have not been found.
 * @type {{path: (function(): *), label: string, triggersEnter: (function(): *[]), load(), target: null, template:
 *   string, roles: null, data: null}}
 */

Routes.notFound = {
  path: () => `${settings().notFound}`,
  label: 'pages.notFound.title',
  triggersEnter: () => [],
  async load () {
    return import('../pages/notfound/notFound')
  },
  target: null,
  template: 'notFound',
  data: {
    next () {
      go(Routes.overview)
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
    createTrigger(() => true, Routes.notFound.path)
  ],
  async load () {
    return import('../pages/loading/loading')
  },
  target: null,
  template: 'loading',
  data: null
}

Routes.demo = {
  path: () => `${settings().demo}`,
  label: 'pages.welcome.title',
  triggersEnter: () => [function () {
    go(Routes.welcome, true)
  }],
  load: () => {}
}

/**
 * Legal routes need to be present for all possible sub-types:
 * - imprint
 * - terms
 * - privacy
 * - contact
 */
Routes.legal = {
  path: (type = ':type') => {
    return `${settings().legal.title}/${settings().legal[type] || type}`
  },
  label: 'legal.title',
  triggersEnter: () => [],
  async load () {
    return import('../pages/legal/legal')
  },
  target: null,
  template: 'legal',
  data: {
    next () {
      go(Routes.overview)
    }
  }
}

/**
 * The starting page of the app
 */
Routes.welcome = {
  path: (isDemo = false) => {
    return isDemo
      ? `${settings().welcome}?demo=1`
      : `${settings().welcome}`
  },
  label: 'pages.welcome.title',
  triggersEnter: () => [],
  async load () {
    return import('../pages/welcome/welcome')
  },
  target: null,
  template: 'welcome',
  data: {
    next () {
      go(Routes.overview)
    }
  }
}

const toWelcome = createTrigger(loggedOut, () => Routes.welcome.path())

/**
 * Overview page to select dimension and level
 */
Routes.overview = {
  path: () => `${settings().overview}`,
  label: 'pages.overview.title',
  triggersEnter: () => [toWelcome],
  async load () {
    return import('../pages/overview/overview')
  },
  target: null,
  template: 'overview',
  onAction () {
    window.scrollTo(0, 0)
  },
  data: {
    next ({ sessionId, unitId }) {
      go(Routes.unit, sessionId, unitId)
    },
    story ({ sessionId, unitSetId, unitId }) {
      go(Routes.story, sessionId, unitSetId, unitId)
    }
  }
}

Routes.story = {
  path: (sessionId = ':sessionId', unitSetId = ':unitSetId', unitId = ':unitId') => {
    return `${settings().story}/${sessionId}/${unitSetId}/${unitId}`
  },
  label: 'pages.unit.story',
  triggersEnter: () => [toWelcome],
  async load () {
    return import('../pages/story/story')
  },
  target: null,
  template: 'story',
  onAction () {
    window.scrollTo(0, 0)
  },
  data: {
    next ({ sessionId, unitId }) {
      if (!sessionId) {
        return go(Routes.overview)
      }

      return (!unitId)
        ? go(Routes.complete, sessionId)
        : go(Routes.unit, sessionId, unitId)
    },
    exit () {
      go(Routes.overview)
    }
  }
}
/**
 * Unit process page, where all units are dynamically rendered and processed.
 */

Routes.unit = {
  path: (sessionId = ':sessionId', unitId = ':unitId') => {
    return `${settings().unit}/${sessionId}/${unitId}`
  },
  label: 'pages.unit.title',
  triggersEnter: () => [toWelcome],
  async load () {
    return import('../pages/unit/unit')
  },
  target: null,
  template: 'unit',
  onAction () {
    window.scrollTo(0, 0)
  },
  data: {
    next ({ sessionId, unitId, unitSetId, hasStory, completed }) {
      if (!sessionId) {
        return go(Routes.overview)
      }

      // if we have entered a new unitSet and the unitSet is flagged with
      // having a story, then we need to transit to the story page first
      if (unitSetId && hasStory) {
        return go(Routes.story, sessionId, unitSetId, unitId)
      }

      return (!unitId || completed)
        ? go(Routes.complete, sessionId)
        : go(Routes.unit, sessionId, unitId)
    },
    exit () {
      go(Routes.overview)
    },
    finish ({ sessionId }) {
      return sessionId
        ? go(Routes.complete, sessionId)
        : go(Routes.overview)
    }
  }
}

Routes.complete = {
  path: (sessionId = ':sessionId') => {
    return `${settings().complete}/${sessionId}`
  },
  label: 'pages.complete.title',
  triggersEnter: () => [toWelcome],
  async load () {
    return import('../pages/complete/complete')
  },
  target: null,
  template: 'complete',
  onAction () {
    window.scrollTo(0, 0)
  },
  data: {
    end () {
      go(Routes.logout)
    },
    next () {
      go(Routes.overview)
    },
    exit () {
      go(Routes.logout)
    }
  }
}

Routes.logout = {
  path: () => {
    return `${settings().logout}`
  },
  label: 'pages.logout.title',
  triggersEnter: () => [],
  async load () {
    return import('../pages/logout/logout')
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

const toOverview = createTrigger(loggedIn, () => Routes.overview)

/**
 * The default route to be used when landing on the page without params
 * @type {{path: (function(): string), label: string, triggersEnter: (function(): *[]), load(): Promise<undefined>,
 *   target: null, template: null, roles: null, data: null}}
 */
Routes.root = {
  path: () => '/',
  label: 'pages.redirecting.title',
  triggersEnter: () => [
    toWelcome,
    toOverview
  ],
  async load () {
    return import('../pages/loading/loading')
  },
  target: null,
  template: 'loading',
  data: null
}

Object.keys(Routes).forEach(key => {
  Routes[key].key = key
})

Routes.diagnostics = {
  path: () => {
    return `${settings().diagnostics}`
  },
  label: 'pages.diagnostics.title',
  triggersEnter: () => [],
  async load () {
    return import('../pages/diagnostics/diagnostics')
  },
  target: null,
  template: 'diagnostics',
  data: {
    next () {
      go(Routes.demo)
    }
  }
}
