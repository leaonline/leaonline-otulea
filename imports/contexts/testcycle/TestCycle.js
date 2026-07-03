import { TestCycle } from 'meteor/leaonline:corelib/contexts/TestCycle'
import { createGetAllMethod } from '../../api/services/createGetAllMethod'
import { createGetMethod } from '../../api/services/createGetMethod'

TestCycle.sync = {
  query: { isLegacy: true }
}
TestCycle.isLocalCollection = true

TestCycle.methods = TestCycle.methods ?? {}
TestCycle.methods.getAll = createGetAllMethod({
  context: TestCycle,
  backendOnly: false
//  defaultQuery: { isLegacy: true }
})

TestCycle.methods.get = createGetMethod({
  context: TestCycle,
  backendOnly: false
//  defaultQuery: { isLegacy: true }
})

export { TestCycle }
