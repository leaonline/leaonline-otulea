/* eslint-env mocha */
import { onClientExec } from '../../../utils/archUtils'

describe('i18n', () => {
  require('./translate.tests')
  require('./addToLanguage.tests')

  onClientExec(() => {
    require('./initLanguage.tests')
  })
})
