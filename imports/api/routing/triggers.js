/* global Roles */
import { Meteor } from 'meteor/meteor'
import { check } from 'meteor/check'

export const loggedIn = () => Meteor.userId() && Meteor.user()
export const loggedOut = () => !loggedIn()

export const createLoginTrigger = ({ go, location, path }) => {
  check(go, Function)
  check(location, Function)
  check(path, Function)
  return function loginTrigger () {
    if (loggedOut()) {
      const location = location()
      const fullPath = path(encodeURIComponent(location))
      go(fullPath)
    }
  }
}

export const createLoggedinTrigger = ({ go, resolveRouteFct }) => {
  check(resolveRouteFct, Function)
  check(go, Function)
  return function loggedTrigger () {
    if (loggedIn()) {
      go(resolveRouteFct())
    }
  }
}
