import { UnitSet } from 'meteor/leaonline:corelib/contexts/UnitSet'
import { createGetAllMethod } from '../../api/services/createGetAllMethod'
import { createGetMethod } from '../../api/services/createGetMethod'

UnitSet.sync = {
  query: { isLegacy: true }
}
UnitSet.isLocalCollection = true

UnitSet.methods = UnitSet.methods ?? {}
UnitSet.methods.getAll = createGetAllMethod({
  context: UnitSet,
  backendOnly: false
})

UnitSet.methods.get = createGetMethod({
  context: UnitSet,
  backendOnly: false
})

export { UnitSet }
