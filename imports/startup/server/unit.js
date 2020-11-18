import { Unit } from '../../contexts/Unit'
import { createCollection } from '../../factories/collection/createCollection'

const collection = createCollection(Unit)
Unit.collection = () => collection
