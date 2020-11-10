import { UnitSet } from '../../api/session/UnitSet'
import { createCollection } from '../../factories/collection/createCollection'

const collection = createCollection(UnitSet)
UnitSet.collection = () => collection
