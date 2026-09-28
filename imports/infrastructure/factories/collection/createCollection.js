import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { createCollectionFactory } from 'meteor/leaonline:collection-factory'
import { Schema } from '../../../api/schema/Schema'
import { LocalCollections } from '../../collections/LocalCollections'

const collectionFactory = createCollectionFactory({
  schemaFactory: Schema.create,
})

export const createCollection = (context, debug = console.debug) => {
  const { name } = context
  const options = {
    name: context.name,
    schema: context.schema,
    attachSchema: true,
  }

  const isLocal = Meteor.isClient && context.isLocalCollection

  if (isLocal) {
    const local = new Mongo.Collection(null)
    local._name = name
    LocalCollections.add(name, local)
    options.collection = local
  }

  const localText = isLocal ? '(local)' : '(synced)'
  debug(`[collectionFactory]: create ${name} ${localText}`)

  const collection = collectionFactory(options)
  context.collection = () => collection

  return collection
}
