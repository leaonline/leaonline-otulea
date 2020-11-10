import { createCollection } from '../../factories/collection/createCollection'

const created = new Set()

export const initClientContext = context => {
  if (created.has(context.name)) {
    return context
  }

  createCollection(context)
  created.add(context.name)

  return context
}
