/* eslint-env mocha */
import { Meteor } from 'meteor/meteor'
import { Feedback } from '../Feedback'

describe(Feedback.name, () => {
  if (Meteor.isServer) {
    describe('api', () => {
      require('./getAlphaLevels.tests')
      require('./getCompetencies.tests')
      require('./generateFeedback.tests')
    })
  }
})
