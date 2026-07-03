import { createCollection } from '../../infrastructure/factories/collection/createCollection'
import { createMethods } from '../../infrastructure/factories/method/createMethods'
import { rateLimitMethods } from '../../infrastructure/factories/ratelimit/rateLimit'
import { ContentServer } from '../../api/remotes/content/ContentServer'
// contexts
import { AlphaLevel } from '../../contexts/AlphaLevel'
import { Competency } from '../../contexts/Competency'
import { Dimension } from '../../contexts/Dimension'
import { Level } from '../../contexts/Level'
import { TestCycle } from '../../contexts/testcycle/TestCycle'
import { Thresholds } from '../../contexts/thresholds/Thresholds'
import { Unit } from '../../contexts/Unit'
import { UnitSet } from '../../contexts/unitSet/UnitSet'

const contexts = [AlphaLevel, Competency, Dimension, Level, TestCycle, Thresholds, Unit, UnitSet]

for (const context of contexts) {
  const collection = createCollection(context)
  context.collection = () => collection

  if (context.methods) {
    const methods = Object.values(context.methods)
    createMethods(methods)
    rateLimitMethods(methods)
  }

  if (context.sync) {
    ContentServer.registerForSync(context)
  }
}
