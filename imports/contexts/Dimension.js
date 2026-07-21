import { Dimension } from 'meteor/leaonline:corelib/contexts/Dimension'
import { createGetAllMethod } from '../api/services/createGetAllMethod'
import { createGetMethod } from '../api/services/createGetMethod'

Dimension.sync = {
  query: { isLegacy: true }
}
Dimension.isLocalCollection = true

Dimension.methods = Dimension.methods ?? {}
Dimension.methods.getAll = createGetAllMethod({
  context: Dimension,
  backendOnly: false,
})

Dimension.methods.get = createGetMethod({
  context: Dimension,
  backendOnly: false,
})

export { Dimension }
