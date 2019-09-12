import { Mongo } from 'meteor/mongo'
import { Schema } from '../../api/schema/Schema'

export const createCollection = ({ name, schema }) => {
  const collection = new Mongo.Collection(name)
  const collectionSchema = Schema.create(schema)
  collection.attachSchema(collectionSchema)
  return collection
}
