/* eslint-env mocha */
import { onServerExec, onClientExec } from '../../imports/utils/archUtils'

describe('api', () => {
  onServerExec(() => {
    require('../../imports/api/accounts/tests')
    require('../../imports/api/http/tests/fetchDoc.tests')
    require('../../imports/api/notify/tests')
    require('../../imports/api/remotes/content/tests')
  })

  require('../../imports/api/i18n/tests')
  require('../../imports/api/lists/tests/DocumentLists.tests')
  require('../../imports/api/markdown/tests/LeaMarkdown.tests')
  require('../../imports/api/schema/tests/regExSchema.tests')
  require('../../imports/api/scoring/tests')
  require('../../imports/api/url/tests')

  onClientExec(() => {
    require('../../imports/api/context/tests')
    require('../../imports/api/tts/tests')
    require('../../imports/contexts/diagnostics/tests')
  })
})
