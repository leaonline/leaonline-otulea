import { check } from 'meteor/check'

Meteor.methods({
  'registerUser' ({ code }) {
    check(code, String)
    return Accounts.createUser({ username: code, password: code })
  }
})