/* eslint-env mocha */
import { Meteor } from 'meteor/meteor'
import { Feedback } from '../Feedback'

describe(Feedback.name, function () {
  if (Meteor.isServer) {
    describe('api', function () {
      import './generateFeedback.tests'
      import './getAlphaLevels.tests'
      import './getCompetencies.tests'
    })
  }
})
