/* eslint-env mocha */
import { Session } from '../Session'
import { onServerExec } from '../../../utils/archUtils'

describe(Session.name, function () {
  describe('utils', function () {
    import './getSessionDoc.tests'
    import './isCurrentUnit.tests'
    import './isEmptySession.tests'
    import './sessionIsCancelled.tests'
    import './sessionIsComplete.tests'
  })

  onServerExec(function () {
    describe('api', function () {
      import './startSession.tests'
      import './updateSession.tests'
      import './cancelSession.tests'
      import './continueSession.tests'
      import './getLastSessionByTestCycle.tests'
      import './getSessionResponses.tests'
      import './recentCompleted.tests'
      import './results.tests'
    })
  })
})
