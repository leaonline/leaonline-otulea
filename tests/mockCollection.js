import { Mongo } from 'meteor/mongo'
import { Schema } from '../imports/api/schema/Schema'
import Collection2 from 'meteor/aldeed:collection2'

// XXX: backwards compat for pre 4.0 collection2
if (Collection2 && typeof Collection2.load === 'function') {
  Collection2.load()
}

const originals = new Map()

export const mockCollection = (context, { collectionFn, attachSchema = true } = {}) => {
  originals.set(context.name, context.collection)
  const collection = new Mongo.Collection(null)

  if (context.schema && attachSchema === true) {
    const schema = Schema.create(context.schema)
    collection.attachSchema(schema)
  }

  context.collection = collectionFn || (() => collection)
}

export const restoreCollection = context => {
  context.collection = originals.get(context.name)
  originals.delete(context.name)
}

export const clearCollection = context => {
  return context.collection().remove({})
}
