import { Mongo } from 'meteor/mongo'

const originals = new Map()

export const mockCollection = (context, collectionFn) => {
  originals.set(context.name, context.collection)
  context.collection = collectionFn || (() => new Mongo.Collection(null))
}

export const restoreCollection = context => {
  context.collection = originals.get(context.name)
  originals.delete(context.name)
}
