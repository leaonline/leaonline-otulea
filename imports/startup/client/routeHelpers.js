import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { Routes } from '../../ui/routing/Routes'
import { Router } from '../../ui/routing/Router'
import { resolveRoute, backRoute } from '../../ui/routing/routeHelpers'

Template.registerHelper('route', function (key, ...optionalArgs) {
  return resolveRoute(key, ...optionalArgs)
})

Template.registerHelper('routeDef', function (key) {
  return Routes[key]
})

Template.registerHelper('backRoute', function () {
  return backRoute()
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

Template.registerHelper('log', function (...args) {
  args.pop()
  console.log(...args)
})

Template.registerHelper('url', function (path) {
  return Meteor.absoluteUrl(path, {
    secure: Meteor.isProduction
  })
})

Template.registerHelper('isDebugUser', function () {
  return global.isDebugUser()
})

Template.registerHelper('isDemoUser', function (userObj) {
  const user = userObj || Meteor.user() || {}
  return user.demo
})
