/* global Roles */
import { check } from 'meteor/check'
import { Router } from './Router'
import { loggedIn, loggedOut } from '../../utils/accountUtils'

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
