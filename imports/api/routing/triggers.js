/* global Roles */
import { Meteor } from 'meteor/meteor'
import { check } from 'meteor/check'
import { Router} from './Router'

export const loggedIn = () => Meteor.userId() && Meteor.user()
export const loggedOut = () => !loggedIn()

export const createLoginTrigger = (redirectRoute) => {
  check(redirectRoute.path, Function)
  return function loginTrigger () {
    if (loggedOut()) {
      const location = Router.location()
      const fullPath = redirectRoute.path(encodeURIComponent(location))
      Router.go(fullPath)
    }
  }
}

export const createLoggedinTrigger = (resolveRouteFct) => {
  check(resolveRouteFct, Function)
  return function loggedTrigger () {
    if (loggedIn()) {
      Router.go(resolveRouteFct())
    }
  }
}

export const createNotFoundTrigger = (route) => () => Router.go(route)
