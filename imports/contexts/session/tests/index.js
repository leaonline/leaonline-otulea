/* eslint-env mocha */
import { Meteor } from 'meteor/meteor'
import { Session } from '../Session'

describe(Session.name, function () {
  describe('utils', function () {
    import './getSessionDoc.tests'
    import './isCurrentUnit.tests'
    import './isEmptySession.tests'
    import './sessionIsCancelled.tests'
    import './sessionIsComplete.tests'
  })

  if (Meteor.isServer) {
    describe('api', function () {
      import './startSession.tests'
      import './updateSession.tests'
      import './cancelSession.tests'
      import './continueSession.tests'
      import './getLastSessionByTestCycle.tests'
      import './getSessionResponses.tests'
    })
  }
})
