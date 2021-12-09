/* eslint-env mocha */
import { onServerExec, onClientExec } from '../../imports/utils/archUtils'

describe('api', function () {
  onServerExec(function () {
    import '../../imports/api/accounts/tests'
    import '../../imports/api/notify/tests'
  })

  import '../../imports/api/i18n/tests'
  import '../../imports/api/lists/tests/DocumentLists.tests'
  import '../../imports/api/scoring/tests'
  import '../../imports/api/url/tests'

  onClientExec(function () {
    import '../../imports/api/context/tests'
  })
})
