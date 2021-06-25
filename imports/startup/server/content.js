import { Level } from '../../contexts/Level'
import { Dimension } from '../../contexts/Dimension'
import { createCollection } from '../../infrastructure/factories/collection/createCollection'

const levelCollection = createCollection(Level)
Level.collection = () => levelCollection

const dimensionCollection = createCollection(Dimension)
Dimension.collection = () => dimensionCollection
