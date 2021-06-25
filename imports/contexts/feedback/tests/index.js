/* eslint-env mocha */
import { Meteor } from 'meteor/meteor'
import { Feedback } from '../Feedback'

describe(Feedback.name, function () {
  if (Meteor.isServer) {
    describe('api', function () {
      import './getAlphaLevels.tests'
      import './getCompetencies.tests'
      import './generateFeedback.tests'
    })
  }
})
