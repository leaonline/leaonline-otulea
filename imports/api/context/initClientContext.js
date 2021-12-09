import { createCollection } from '../../infrastructure/factories/collection/createCollection'
import Collection2 from 'meteor/aldeed:collection2'

const created = new Set()
const collection2Init = false

/**
 * Lightweight initialization for contexts on the client-side.
 *
 * @param context {object} a context definition object
 * @param debug {function}
 * @return {object} the transformed context
 */
export const initClientContext = (context, debug = console.debug) => {
  if (created.has(context.name)) {
    return context
  }

  if (!collection2Init) {
    Collection2.load()
  }

  createCollection(context, debug)
  created.add(context.name)

  return context
}
