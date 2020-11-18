import { UnitSet } from '../../contexts/UnitSet'
import { createCollection } from '../../factories/collection/createCollection'

const collection = createCollection(UnitSet)
UnitSet.collection = () => collection
