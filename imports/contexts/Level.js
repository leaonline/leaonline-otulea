import { Level } from 'meteor/leaonline:corelib/contexts/Level'
import { createGetAllMethod } from '../api/services/createGetAllMethod'
import { createGetMethod } from '../api/services/createGetMethod'

Level.sync = {
  query: { isLegacy: true }
}
Level.isLocalCollection = true

Level.methods = Level.methods ?? {}
Level.methods.getAll = createGetAllMethod({
  context: Level,
  backendOnly: false
})

Level.methods.get = createGetMethod({
  context: Level,
  backendOnly: false
})

export { Level }
