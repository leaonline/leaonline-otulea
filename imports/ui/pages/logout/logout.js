import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { LeaCoreLib } from '../../../api/core/LeaCoreLib'
import './logout.html'

const components = LeaCoreLib.components
const loaded = components.load([components.template.textGroup])

Template.logout.onCreated(function () {
  Meteor.logout(err => {
    if (err) {
      console.error(err)
    }
  })
})

Template.logout.helpers({
  loadComplete () {
    return loaded.get()
  }
})
