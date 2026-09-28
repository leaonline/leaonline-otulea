/* eslint-env mocha */
import { Session } from '../Session'
import { onServerExec } from '../../../utils/archUtils'

describe(Session.name, () => {
  describe('utils', () => {
    require('./getSessionDoc.tests')
    require('./isCurrentUnit.tests')
    require('./isEmptySession.tests')
    require('./sessionIsCancelled.tests')
    require('./sessionIsComplete.tests')
  })

  onServerExec(() => {
    describe('api', () => {
      require('./startSession.tests')
      require('./updateSession.tests')
      require('./cancelSession.tests')
      require('./continueSession.tests')
      require('./getLastSessionByTestCycle.tests')
      require('./getSessionResponses.tests')
      require('./recentCompleted.tests')
      require('./results.tests')
    })
  })
})
