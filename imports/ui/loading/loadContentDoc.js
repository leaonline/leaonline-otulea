import { EJSON } from 'meteor/ejson'
import { Meteor } from 'meteor/meteor'
import { getLocalCollection } from '../../infrastructure/collections/getLocalCollection'
import { callMethod } from '../../infrastructure/methods/callMethod'
import { asyncHTTP } from './asyncHTTP'

export const createContentDocLoader = ({
  methodCall = callMethod,
  http = asyncHTTP,
  getCollection = getLocalCollection,
  contentBase = Meteor.settings.public.hosts.content.base,
} = {}) => {
  const loadRemote = async ({ name, context, query }) => {
    let route
    if (query?.shortCode) route = context.routes?.byCode
    if (query?._id) route = context.routes?.byId
    if (!route) {
      throw new Error(`No route for query/context: ${query}, ${context}`)
    }
    const url = new URL(name ?? `${contentBase}${route.path}`)
    url.search = new URLSearchParams(query)
    const response = await http('GET', url.toString())
    if (response.statusCode >= 400) {
      throw new Error(response.statusCode + response.content)
    }
    return response?.data
  }

  const loaders = {
    remote: loadRemote,
    current: ({ name, context, query }) =>
      methodCall({
        name: name ?? context.methods.get,
        args: query,
      }),
  }

  /** Loads and caches one content document. */
  return async ({
    context,
    collection,
    name,
    unlessExists,
    query,
    from = 'current',
    debug = () => {},
    throwIfNotFound = false,
  }) => {
    if (!context) throw new Error('Context is expected')
    debug('loadContentDoc', context.name, JSON.stringify(query, null, 0))

    const localCollection =
      collection ?? context.collection?.() ?? getCollection(context.name)
    if (!localCollection) {
      throw new Error(`Expected collection for ctx ${context.name}`)
    }

    const existingDocument = localCollection.findOne(query)
    if (unlessExists && existingDocument) return existingDocument

    const methodName = name ?? context.methods?.get
    if (!methodName) {
      throw new Error(`Expected method name for ctx ${context.name}`)
    }

    const loader = loaders[from]
    if (!loader) throw new Error(`Expected loader by given type "${from}"`)

    const document = await loader({ context, name, query })
    if (!document && throwIfNotFound) {
      throw new Error(
        `Expected document for ctx ${context.name} and query ${
          query ? EJSON.stringify(query) : undefined
        }`,
      )
    }

    if (document) {
      if (typeof document !== 'object' || !document._id) {
        throw new Error(`Expected document with _id for ctx ${context.name}`)
      }
      localCollection.upsert({ _id: document._id }, { $set: { ...document } })
    }

    return document
  }
}

export const loadContentDoc = createContentDocLoader()
