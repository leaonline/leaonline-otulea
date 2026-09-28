const unexpectedType = (value, expected) =>
  new Error(`Unexpected format: got [${typeof value}], expected ${expected}`)

/**
 * Create the application router facade and its route-lifecycle configuration.
 * Runtime integrations are injected so the lifecycle can be exercised without
 * booting FlowRouter or rendering Blaze templates.
 */
export const createRouter = ({
  source,
  routerHelpers,
  templateRegistry,
  loggingIn,
  autorun,
  translate,
  documentRef,
  schedule,
  warn = console.warn,
}) => {
  const paths = {}
  let titlePrefix = ''
  let loadingTemplate

  const createRouteLifecycle = (routeDefinition, onError = console.error) => {
    if (!routeDefinition) {
      throw new Error(
        `Fatal: expected route-definition, got ${routeDefinition}.`,
      )
    }

    return {
      name: routeDefinition.key,
      whileWaiting() {
        if (
          !templateRegistry[routeDefinition.template] &&
          routeDefinition.showLoading !== false
        ) {
          this.render(routeDefinition.target, loadingTemplate)
        }
      },
      waitOn() {
        return Promise.all([
          Promise.resolve(routeDefinition.load()),
          new Promise((resolve) => {
            autorun((computation) => {
              if (!loggingIn()) {
                computation.stop()
                resolve()
              }
            })
          }),
        ])
      },
      triggersEnter: routeDefinition?.triggersEnter?.(),
      action(params, queryParams) {
        if (!templateRegistry[routeDefinition.template]) {
          warn(
            `Found rendering attempt on unloaded Template [${routeDefinition.template}]`,
          )
          return
        }

        routeDefinition.onAction?.(params, queryParams)

        const data = routeDefinition.data || {}
        data.params = params
        data.queryParams = queryParams

        const label = translate(routeDefinition.label)
        documentRef.title = `${titlePrefix} ${label}`

        if (label.includes('.')) {
          schedule(() => {
            const updatedLabel = translate(routeDefinition.label)
            documentRef.title = `${titlePrefix} ${updatedLabel}`
          }, 500)
        }

        try {
          this.render(routeDefinition.target, routeDefinition.template, data)
        } catch (error) {
          if (typeof onError === 'function') {
            onError(error)
          }
        }
      },
    }
  }

  const router = {
    src: source,
    debug: false,
    go(value, ...optionalArgs) {
      if (typeof value === 'object' && value !== null) {
        return source.go(value.path(...optionalArgs))
      }
      if (typeof value === 'string') {
        return source.go(value)
      }
      throw unexpectedType(value, 'string or object')
    },
    has(path) {
      return paths[path]
    },
    location(options = {}) {
      if (options.pathName) {
        return source.current().route.name
      }
      return source.current().path
    },
    current(options = {}) {
      if (options.reactive) {
        source.watchPathChange()
      }
      return source.current()
    },
    param(value) {
      if (typeof value === 'object' && value !== null) {
        return source.setParams(value)
      }
      if (typeof value === 'string') {
        return source.getParam(value)
      }
      throw unexpectedType(value, 'string or object')
    },
    queryParam(value) {
      if (typeof value === 'object' && value !== null) {
        return source.setQueryParams(value)
      }
      if (typeof value === 'string') {
        return source.getQueryParam(value)
      }
      throw unexpectedType(value, 'string or object')
    },
    titlePrefix(value = '') {
      titlePrefix = value
    },
    loadingTemplate(value = 'loading') {
      loadingTemplate = value
    },
    register(routeDefinition, onError) {
      const path = routeDefinition.path()
      paths[path] = routeDefinition
      return source.route(path, createRouteLifecycle(routeDefinition, onError))
    },
    helpers: {
      isActive(name) {
        return routerHelpers.name(name)
      },
    },
  }

  return { router, createRouteLifecycle }
}
