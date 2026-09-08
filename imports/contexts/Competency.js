import { Competency } from 'meteor/leaonline:corelib/contexts/Competency'
import { createGetAllMethod } from '../api/services/createGetAllMethod'
import { createGetMethod } from '../api/services/createGetMethod'

Competency.sync = {
  query: { isLegacy: true },
}
Competency.isLocalCollection = true

Competency.methods = Competency.methods ?? {}
Competency.methods.getAll = createGetAllMethod({
  context: Competency,
  backendOnly: false,
})

Competency.methods.get = createGetMethod({
  context: Competency,
  backendOnly: false,
})

export { Competency }
