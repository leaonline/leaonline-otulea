import { Thresholds } from 'meteor/leaonline:corelib/contexts/Thresholds'
import { createGetMethod } from '../../api/services/createGetMethod'
import { createGetAllMethod } from '../../api/services/createGetAllMethod'

Thresholds.sync = {
  query: {},
}
Thresholds.isLocalCollection = true

Thresholds.methods = Thresholds.methods ?? {}
Thresholds.methods.get = createGetMethod({
  context: Thresholds,
  backendOnly: false,
})

Thresholds.methods.getAll = createGetAllMethod({
  context: Thresholds,
  backendOnly: false,
})

export { Thresholds }
