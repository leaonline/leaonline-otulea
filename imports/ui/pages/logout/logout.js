import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import '../../components/textgroup/textgroup'
import './logout.html'

Template.logout.onCreated(function () {
  Meteor.logout(err => console.error(err))
})