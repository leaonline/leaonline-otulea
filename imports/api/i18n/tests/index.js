/* eslint-env */
import { onClient, onClientExec } from '../../../utils/archUtils'

describe('i18n', function () {
  import './translate.tests'
  import './addToLanguage.tests'

  onClientExec(function () {
    import './initLanguage.tests'
  })
})
