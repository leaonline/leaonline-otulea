import { FlowRouter, RouterHelpers } from 'meteor/ostrio:flow-router-extra'
import { Meteor } from 'meteor/meteor'
import { Tracker } from 'meteor/tracker'
import { Template } from 'meteor/templating'
import { translate } from '../../api/i18n/translate'
import { createRouter } from './createRouter'

/**
 * Facade to a router to support a common definition for routing in case
 * the underlying router will change or be replaced due to a better version
 * or when development of the router stopped.
 */
const created = createRouter({
  source: FlowRouter,
  routerHelpers: RouterHelpers,
  templateRegistry: Template,
  loggingIn: () => Meteor.loggingIn(),
  autorun: (callback) => Tracker.autorun(callback),
  translate,
  documentRef: document,
  schedule: (callback, delay) => setTimeout(callback, delay),
})

export const Router = created.router
export const createRouteLifecycle = created.createRouteLifecycle
export { createRouter }
