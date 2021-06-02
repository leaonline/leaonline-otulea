import { createCollection } from '../../infrastructure/factories/collection/createCollection'
import Collection2 from 'meteor/aldeed:collection2'

const created = new Set()
let collection2Init = false

export const initClientContext = context => {
  if (created.has(context.name)) {
    return context
  }

  if (!collection2Init) {
    Collection2.load()
  }

  createCollection(context)
  created.add(context.name)

  return context
}
