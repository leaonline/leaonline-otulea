import { TestCycle } from '../../contexts/testcycle/TestCycle'
import { createCollection } from '../../infrastructure/factories/collection/createCollection'

const collection = createCollection(TestCycle)
TestCycle.collection = () => collection
