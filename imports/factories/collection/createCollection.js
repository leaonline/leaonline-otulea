import { Mongo } from 'meteor/mongo'
import { createCollectionFactory } from 'meteor/leaonline:collection-factory'
import { Schema } from '../../api/schema/Schema'

const collectionFactory = createCollectionFactory({
  schemaFactory: Schema.create
})

export const createCollection = (context) => {
  const { name } = context

  if (context.isLocalCollection) {
    context.collection = new Mongo.Collection(null)
  }

  const localText = context.isLocalCollection ? '(local)' : ''
  console.info(`[collectionFactory]: create ${name} ${localText}`)

  const collection = collectionFactory(context)
  context.collection = () => collection

  return collection
}
