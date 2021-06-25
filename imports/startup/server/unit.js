import { Unit } from '../../contexts/Unit'
import { createCollection } from '../../infrastructure/factories/collection/createCollection'

const collection = createCollection(Unit)
Unit.collection = () => collection
