import { Mongo } from 'meteor/mongo'
import { Schema } from '../imports/api/schema/Schema'
import Collection2 from 'meteor/aldeed:collection2'

Collection2.load() // lazy init

const originals = new Map()

export const mockCollection = (context, { collectionFn, attachSchema = true } = {}) => {
  originals.set(context.name, context.collection)
  const collection = new Mongo.Collection(null)

  if (context.schema && attachSchema) {
    const schema = Schema.create(context.schema)
    collection.attachSchema(schema)
  }

  context.collection = collectionFn || (() => collection)
}

export const restoreCollection = context => {
  context.collection = originals.get(context.name)
  originals.delete(context.name)
}
