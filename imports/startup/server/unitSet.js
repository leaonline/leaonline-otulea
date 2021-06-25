import { UnitSet } from '../../contexts/unitSet/UnitSet'
import { createCollection } from '../../infrastructure/factories/collection/createCollection'

const collection = createCollection(UnitSet)
UnitSet.collection = () => collection
