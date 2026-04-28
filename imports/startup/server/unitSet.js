import { UnitSet } from '../../contexts/unitSet/UnitSet'
import { createCollection } from '../../infrastructure/factories/collection/createCollection'
import { ContentServer } from '../../api/remotes/content/ContentServer'

const collection = createCollection(UnitSet)
UnitSet.collection = () => collection
ContentServer.registerForSync(UnitSet)