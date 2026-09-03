import { Level } from '../../contexts/Level'
import { Dimension } from '../../contexts/Dimension'
import { createCollection } from '../../infrastructure/factories/collection/createCollection'
import { ContentServer } from '../../api/remotes/content/ContentServer'
import { AlphaLevel } from '../../contexts/AlphaLevel'
import { Competency } from '../../contexts/Competency'

const allCtx = [Level, Dimension, AlphaLevel, Competency]
allCtx.forEach((ctx) => {
  const collection = createCollection(ctx)
  ctx.collection = () => collection
  ContentServer.registerForSync(ctx)
})
