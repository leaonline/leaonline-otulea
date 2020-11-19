import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { createCollectionFactory } from 'meteor/leaonline:collection-factory'
import { Schema } from '../../../api/schema/Schema'
import { onServerExec } from '../../../utils/archUtils'

const collectionFactory = createCollectionFactory({
  schemaFactory: Schema.create
})

export const createCollection = (context) => {
  const { name } = context

  if (context.isLocalCollection) {
    context.collection = Meteor.isClient && new Mongo.Collection(null)
    onServerExec(function () {
      const { LocalCacheCollection } = require('../../cache/collection/LocalCacheCollection')
      context.collection = new LocalCacheCollection(context)
    })
  }

  const localText = context.isLocalCollection ? '(local)' : ''
  console.info(`[collectionFactory]: create ${name} ${localText}`)

  const collection = collectionFactory(context)
  context.collection = () => collection

  return collection
}
