/* global Roles */
import { FlowRouter, RouterHelpers } from 'meteor/ostrio:flow-router-extra'
import { Meteor } from 'meteor/meteor'
import { Tracker } from 'meteor/tracker'
import { translate } from '../i18n/reactiveTranslate'

/**
 * Facade to a router to support a common definition for routing in case
 * the underlying router will change or be replaced due to a better version
 * or when development of the router stopped.
 */
export const Router = {}
Router.src = FlowRouter
Router.debug = false

Router.go = function (value, ...optionalArgs) {
  const type = typeof value
  if (type === 'object' && value !== null) {
    return FlowRouter.go(value.path(...optionalArgs))
  } else if (type === 'string') {
    return FlowRouter.go(value)
  } else {
    throw new Error(`Unexpected format: [${typeof type}], expected string or object`)
  }
}

Router.has = function (path) {
  return paths[ path ]
}

Router.location = function (options = {}) {
  if (options.pathName) {
    return FlowRouter.current().route.name
  }
  return FlowRouter.current().path
}

Router.current = function (options = {}) {
  if (options.reactive) {
    FlowRouter.watchPathChange()
  }
  return FlowRouter.current()
}

Router.param = function (value) {
  const type = typeof value
  if (type === 'object') {
    return FlowRouter.setParams(value)
  }
  if (type === 'string') {
    return FlowRouter.getParam(value)
  }
  throw new Error(`Unexpected format: [${type}], expected string or object`)
}

Router.queryParam = function (value) {
  const type = typeof value
  if ('object' === type) {
    return FlowRouter.setQueryParams(value)
  }
  if ('string' === type) {
    return FlowRouter.getQueryParam(value)
  }
  throw new Error(`Unexpected format: [${type}], expected string or object`)
}

let _titlePrefix = ''

Router.titlePrefix = function (value = '') {
  _titlePrefix = value
}

const paths = {}

/*
    .whileWaiting() hook
    .waitOn() hook
    .waitOnResources() hook
    .endWaiting() hook
    .data() hook
    .onNoData() hook
    .triggersEnter() hooks
    .action() hook
    .triggersExit() hooks
 */
function createRoute (routeDef, onError) {
  return {
    name: routeDef.key,
    whileWaiting () {
      // we render by default a "loading" template
      // which can be explicitly prevented
      if (routeDef.showLoading !== false) {
        this.render(routeDef.target, 'loading', { title: routeDef.label })
      }
    },
    waitOn () {
      return new Promise((resolve) => {
        routeDef.load()
          .then(() => {
            Tracker.autorun((computation) => {
              const loadComplete = !Meteor.loggingIn() && Roles.subscription.ready()
              if (loadComplete) {
                setTimeout(() => {
                  computation.stop()
                  resolve()
                }, 300)
              }
            })
          })
          .catch(e => {
            console.error(e)
            resolve()
          })
      })
    },
    triggersEnter: routeDef.triggersEnter && routeDef.triggersEnter(),
    action (params, queryParams) {
      // run custom actions to run at very first,
      // for example to scroll the window to the top
      // or prepare the window environment otherwise
      if (routeDef.onAction) {
        routeDef.onAction()
      }

      const data = routeDef.data || {}
      data.params = params
      data.queryParams = queryParams

      const label = translate(routeDef.label)
      document.title = `${_titlePrefix} ${label}`

      try {
        this.render(routeDef.target, routeDef.template, data)
      } catch (e) {
        console.error(e)
        if (typeof onError === 'function') {
          onError(e)
        }
      }
    }
  }
}

Router.register = function (routeDefinition) {
  const path = routeDefinition.path()
  paths[ path ] = routeDefinition
  const routeInstance = createRoute(routeDefinition)
  return FlowRouter.route(path, routeInstance)
}

Router.helpers = {
  isActive (name) {
    return RouterHelpers.name(name)
  }
}
