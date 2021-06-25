import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import './logout.html'

Template.logout.onCreated(function () {
  const instance = this
  Meteor.logout(err => {
    if (err) {
      return console.error(err)
    }
    instance.state.set('loggedOut', true)
  })
})

Template.logout.helpers({
  loadComplete () {
    return Template.getState('loggedOut')
  }
})
