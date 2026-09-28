import { Meteor } from 'meteor/meteor'
import { DDP } from 'meteor/ddp-client'
import { Mongo } from 'meteor/mongo'
import { ContentConnection } from './ContentConnection'

/**
 * Extends Meteor.Error, always has error-field as 'contentServer.error'.
 */
export class ContentServerError extends Meteor.Error {
  constructor(reason, details) {
    super('contentServer.error', reason, details)
  }
}

/**
 * Creates an isolated content synchronizer. The default instance below keeps
 * the existing public API, while the factory gives tests a safe transport and
 * collection boundary.
 */
export const createContentServer = ({
  connection = ContentConnection,
  getCollection = (name) => Mongo.getCollection(name),
  getInvocation = () =>
    DDP._CurrentMethodInvocation.get() ||
    DDP._CurrentPublicationInvocation.get(),
  reportError = console.error,
} = {}) => {
  const api = {}
  const contexts = new Set()
  const hooks = new Map([
    ['beforeSyncUpsert', new Map()],
    ['syncEnd', new Map()],
  ])
  let log = () => {}

  api.hooks = {
    beforeSyncUpsert: 'beforeSyncUpsert',
    syncEnd: 'syncEnd',
  }

  api.setLogger = (logger) => {
    log = logger
  }

  api.registerForSync = (context) => {
    log('registerForSync', context.name)
    if (contexts.has(context)) {
      throw new Error(`Context "${context.name}" is already registered!`)
    }
    contexts.add(context)
  }

  api.contexts = () => Array.from(contexts)

  api.init = async () => {
    try {
      await connection.connect({ log })
    } catch (error) {
      reportError(error)
    }
    return api
  }

  const getHookSet = (hookName, contextName) => {
    if (!hooks.has(hookName)) hooks.set(hookName, new Map())
    const contextHooks = hooks.get(hookName)
    if (!contextHooks.has(contextName)) contextHooks.set(contextName, new Set())
    return contextHooks.get(contextName)
  }

  const runHooks = async (hookName, contextName, data) => {
    const callbacks = hooks.get(hookName)?.get(contextName) ?? []
    for (const callback of callbacks) await callback(data)
  }

  api.on = (hookName, contextName, callback) => {
    getHookSet(hookName, contextName).add(callback)
  }

  api.off = (hookName, contextName, callback) => {
    getHookSet(hookName, contextName).delete(callback)
  }

  api.canSync = () => connection.isConnected()

  api.sync = async ({ name, sync, debug } = {}) => {
    log('sync', name)
    if (getInvocation()) throw new ContentServerError('methodOrPubInvocation')
    if (!api.canSync()) throw new ContentServerError('notConnected')

    const contextNames = api.contexts().map((context) => context.name)
    if (!contextNames.includes(name)) {
      throw new ContentServerError('contextNotDefined', { name })
    }

    const collection = getCollection(name)
    if (!collection)
      throw new ContentServerError('collectionNotFound', { name })

    const stats = { name, created: 0, updated: 0, removed: 0, skipped: 0 }
    const query = sync?.query ?? {}
    const result = await connection.get({ name, query, log })
    const allDocs = result?.[name]

    // Empty or malformed remote payloads are never evidence that local data
    // should be deleted. Treat them as a safe no-op.
    if (
      !Array.isArray(allDocs) ||
      allDocs.length === 0 ||
      allDocs.some(
        (document) =>
          !document ||
          typeof document !== 'object' ||
          typeof document._id !== 'string' ||
          document._id.length === 0,
      )
    ) {
      return stats
    }

    const allIds = new Array(allDocs.length)
    for (let index = 0; index < allDocs.length; index++) {
      const document = allDocs[index]
      const { _id: documentId } = document
      allIds[index] = documentId

      if ((await collection.countDocuments({ _id: documentId })) === 0) {
        await runHooks(api.hooks.beforeSyncUpsert, name, {
          type: 'insert',
          doc: document,
        })
        const insertId = await collection.insertAsync(document)
        if (debug) log(name, 'inserted', insertId)
        stats.created++
      } else {
        await runHooks(api.hooks.beforeSyncUpsert, name, {
          type: 'update',
          doc: document,
        })
        const updateDocument = { ...document }
        delete updateDocument._id
        const updated = await collection.updateAsync(documentId, {
          $set: updateDocument,
        })
        if (debug) log(name, 'updated', documentId, '=', updated)
        stats.updated++
      }
    }

    stats.removed = await collection.removeAsync({ _id: { $nin: allIds } })
    log(JSON.stringify(stats))
    await runHooks(api.hooks.syncEnd, name, stats)
    return stats
  }

  return api
}

/**
 * API to communicate with the content server that stores all relevant data.
 * @category api
 * @namespace
 */
export const ContentServer = createContentServer()
