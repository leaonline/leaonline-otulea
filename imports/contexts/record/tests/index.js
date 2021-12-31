/* eslint-env mocha */
import { Record } from '../Record'
import { onServerExec } from '../../../utils/archUtils'

onServerExec(function () {
  describe(Record.name, function () {
    import './addRecord.tests'
  })
})
