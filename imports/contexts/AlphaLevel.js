import { AlphaLevel } from 'meteor/leaonline:corelib/contexts/AlphaLevel'
import { createGetAllMethod } from '../api/services/createGetAllMethod'
import { createGetMethod } from '../api/services/createGetMethod'
import {createLog} from "../utils/createLog";

AlphaLevel.sync = {
  query: {}
}
AlphaLevel.isLocalCollection = true

AlphaLevel.methods = AlphaLevel.methods ?? {}
AlphaLevel.methods.getAll = createGetAllMethod({
  context: AlphaLevel,
  backendOnly: false,
})

AlphaLevel.methods.get = createGetMethod({
  context: AlphaLevel,
  backendOnly: false,
})

export { AlphaLevel }
