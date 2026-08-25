import { EJSON } from 'meteor/ejson'
import { getLocalCollection } from '../../infrastructure/collections/getLocalCollection'
import { callMethod } from '../../infrastructure/methods/callMethod'
import { asyncHTTP } from './asyncHTTP'

/**
 * Loads a single document from the current app's backend
 * @param context {object} The context related to the document.
 * @param query {string|object} The _id or query object for the document
 * @param collection {Mongo.Collection?} optional explicit collection being passed
 * @param name {string?} optional name of the method to load
 * @param from {string?} optional name of the backend from which to load the doc from
 * @param unlessExists {boolean?} optional, set to true to prefer localCollection doc and only load if not exists
 * @param throwIfNotFound {boolean?} optional, throws an error if the doc was not found
 * @param debug {function?} optional debug logger
 * @return {Promise<Object>} A promise resoling to an object or void
 */
export const loadContentDoc = async ({ context, collection, name, unlessExists, query, from = 'current', debug = () => {}, throwIfNotFound = false }) => {
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

  const loader = loaders[from]
  if (!loader) {
    throw new Error(`Expected loader by given type "${from}"`)
  }

  const document = await loader({ context, name, query })

  if (!document && throwIfNotFound) {
    throw new Error(`Expected document for ctx ${context.name} and query ${query ? EJSON.stringify(query) : undefined}`)
  }

  if (document) {
    localCollection.upsert({ _id: document._id }, { $set: { ...document } })
  }

  return document
}

const contentBase = Meteor.settings.public.hosts.content.base
const loaders = {}
loaders.remote = async ({ name, context, query }) => {
  let route
  if (query.shortCode) route = context.routes.byCode
  if (query._id) route = context.routes.byId
  if (!route) throw new Error(`No route for query/context: ${query}, ${context}`)
  const url = new URL(name ?? `${contentBase}${route.path}`)
  url.search = new URLSearchParams(query)
  const res =  await asyncHTTP('GET', url.toString())
  if (res.statusCode >= 400) {
    throw new Error(res.statusCode + res.content)
  }
  return res?.data
}
loaders.current = ({ name, context, query }) =>  callMethod({
  name: name ?? context.methods.get,
  args: query
})