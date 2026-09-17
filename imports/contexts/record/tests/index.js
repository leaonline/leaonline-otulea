/* eslint-env mocha */
import { Record } from '../Record'
import { onServerExec } from '../../../utils/archUtils'

onServerExec(() => {
  describe(Record.name, () => {
    require('./addRecord.tests')
  })
})
