import { Unit } from '../../contexts/Unit'
import { createCollection } from '../../infrastructure/factories/collection/createCollection'
import { ContentServer } from '../../api/remotes/content/ContentServer'

const collection = createCollection(Unit)
Unit.collection = () => collection
ContentServer.registerForSync(Unit)
