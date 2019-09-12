import { Mongo } from "meteor/mongo"

export const getCollection = options => {
  const type = typeof options
  if ('string' === type) {
    return Mongo.Collection.get(options)
  }
  if ('object' === type && options.name && 'string' === typeof options.name) {
    return Mongo.Collection.get(options.name)
  }
  throw new Error(`Unexpected type for "name" -> ${type}, expected String or Object { name:String }`)
}
