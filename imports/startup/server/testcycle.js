import { TestCycle } from '../../contexts/testcycle/TestCycle'
import { createCollection } from '../../infrastructure/factories/collection/createCollection'
import { ContentServer } from '../../api/remotes/content/ContentServer'

const collection = createCollection(TestCycle)
TestCycle.collection = () => collection
ContentServer.registerForSync(TestCycle)