import { EJSON } from 'meteor/ejson'
import { getLocalCollection } from '../../infrastructure/collections/getLocalCollection'
import { callMethod } from '../../infrastructure/methods/callMethod'

/**
 * Loads a single document from the content-server
 * @param context {object} The context related to the document.
 * @param query {string|object} The _id or query object for the document
 * @param debug {function?} optional debug logger
 * @return {Promise<Object>} A promise resoling to an object or void
 */

export const loadContentDoc = async ({ context, collection, name, unlessExists, query, debug = () => {}, throwIfNotFound = false }) => {
  debug('loadContentDoc', context.name, JSON.stringify(query, null, 0))
  if (!context) {
    throw new Error('Context is expected')
  }

  const localCollection = collection ?? context.collection() ?? getLocalCollection(context.name)
  if (!localCollection) {
    throw new Error(`Expected collection for ctx ${context.name}`)
  }

  const existingDoc = localCollection.findOne(query)
  if (unlessExists && existingDoc) {
    return existingDoc
  }

  const methodName = name ?? context.methods.get
  if (!methodName) {
    throw new Error(`Expected method name for ctx ${context.name}`)
  }

  const document = await callMethod({
    name: name ?? context.methods.get,
    args: query
  })

  if (!document && throwIfNotFound) {
    throw new Error(`Expected document for ctx ${context.name} and query ${query ? EJSON.stringify(query) : undefined}`)
  }

  if (document) {
    localCollection.upsert({ _id: document._id }, { $set: { ...document } })
  }

  return document
}
