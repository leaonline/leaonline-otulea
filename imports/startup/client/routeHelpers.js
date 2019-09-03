import { Template } from "meteor/templating"
import { Routes } from '../../api/routing/Routes'
import { Router } from '../../api/routing/Router'
import { resolveRoute } from '../../api/routing/routeHelpers'

Template.registerHelper('route', function (key, ...optionalArgs) {
  return resolveRoute(key, ...optionalArgs)
})

Template.registerHelper('routeDef', function (key) {
  return Routes[ key ]
})

Template.registerHelper('referrer', function () {
  const location = Router.location()
  return encodeURIComponent(location)
})

Template.registerHelper('encodeURIComponent', function (value) {
  return encodeURIComponent(value)
})

Template.registerHelper('join', function (char, ...args) {
  args.pop()
  return args.join(char)
})