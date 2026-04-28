import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { createCollectionFactory } from 'meteor/leaonline:collection-factory'
import { Schema } from '../../../api/schema/Schema'

const collectionFactory = createCollectionFactory({
  schemaFactory: Schema.create
})

export const createCollection = (context, debug = console.debug) => {
  const { name } = context
  const options = {
    name: context.name,
    schema: context.schema,
    attachSchema: true
  }

  const isLocal = context.isLocalCollection && Meteor.isClient

  if (isLocal) {
    options.collection = new Mongo.Collection(null)
  }

  const localText = isLocal ? '(local)' : ''
  debug(`[collectionFactory]: create ${name} ${localText}`)

  const collection = collectionFactory(options)
  context.collection = () => collection

  return collection
}
