/* eslint-env mocha */
import { onServerExec, onClientExec } from '../../imports/utils/archUtils'

describe('api', function () {
  onServerExec(function () {
    require('../../imports/api/accounts/tests')
    require('../../imports/api/notify/tests')
  })

  require('../../imports/api/i18n/tests')
  require('../../imports/api/lists/tests/DocumentLists.tests')
  require('../../imports/api/scoring/tests')
  require('../../imports/api/url/tests')

  onClientExec(function () {
    require('../../imports/api/context/tests')
  })
})
