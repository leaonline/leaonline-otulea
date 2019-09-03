/* global Roles */
import { FlowRouter, RouterHelpers } from 'meteor/ostrio:flow-router-extra'
import { Meteor } from 'meteor/meteor'
import { Tracker } from 'meteor/tracker'

/**
 * Facade to a router to support a common definition for routing in case
 * the underlying router will change or be replaced due to a better version
 * or when development of the router stopped.
 */
export const Router = {}
Router.src = FlowRouter

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
  if (typeof value === 'object') {
    return FlowRouter.setParams(value)
  }
  if (typeof value === 'string') {
    return FlowRouter.getParam(value)
  }
  throw new Error(`Unexpected format: [${typeof value}], expected string or object`)
}

Router.queryParam = function (value) {
  if (typeof value === 'object') {
    return FlowRouter.setQueryParams(value)
  }
  if (typeof value === 'string') {
    return FlowRouter.getQueryParam(value)
  }
  throw new Error(`Unexpected format: [${typeof type}], expected string or object`)
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
    triggersEnter: routeDef.triggersEnter(),
    name: routeDef.key,
    whileWaiting () {
      this.render(routeDef.target, 'loading', { title: routeDef.label })
    },
    waitOn () {
      routeDef.load()
      return new Promise((resolve) => {
        let tracker
        tracker = Tracker.autorun(() => {
          const loadComplete = !Meteor.loggingIn() && Roles.subscription.ready()
          if (loadComplete) {
            setTimeout(() => {
              tracker.stop()
              resolve()
            }, 300)
          }
        })
      })
    },
    action (params, queryParams) {
      window.scrollTo(0, 0)
      const data = routeDef.data || {}
      data.params = params
      data.queryParams = queryParams
      document.title = `CARO ${routeDef.label()}`
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
