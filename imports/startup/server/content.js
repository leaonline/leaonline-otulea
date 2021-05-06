import { Level } from '../../contexts/Level'
import { Dimension } from '../../contexts/Dimension'
import { createMethods } from '../../infrastructure/factories/method/createMethods'
import { rateLimitMethods } from '../../infrastructure/factories/ratelimit/rateLimit'
import { createCollection } from '../../infrastructure/factories/collection/createCollection'

const levelCollection = createCollection(Level)
Level.collection = () => levelCollection

const dimensionCollection = createCollection(Dimension)
Dimension.collection = () => dimensionCollection
