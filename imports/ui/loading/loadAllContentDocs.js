import { callMethod } from '../../infrastructure/methods/callMethod'
import { getLocalCollection } from '../../infrastructure/collections/getLocalCollection'

export const createAllContentDocsLoader = ({
  methodCall = callMethod,
  getCollection = getLocalCollection,
} = {}) => {
  return async ({
    context,
    collection,
    ids,
    name,
    params = {},
    unlessExists,
    debug = () => {},
  }) => {
    debug(`loadAllContentDocs (call) for ${context?.name}`)
    if (!context) throw new Error('Context is expected')

    const localCollection = collection ?? getCollection(context.name)
    if (!localCollection) {
      throw new Error(`Expected collection for ctx ${context.name}`)
    }

    if (unlessExists) {
      const existingQuery = {}
      const idsLength = ids?.length
      if (idsLength) existingQuery._id = { $in: ids }
      const localDocuments = localCollection.find(existingQuery).fetch()

      if (idsLength && localDocuments.length === idsLength) {
        return { [context.name]: localDocuments }
      }
      if (!idsLength && localDocuments.length !== 0) {
        return { [context.name]: localDocuments }
      }
    }

    const methodName = name ?? context.methods?.getAll
    if (!methodName) {
      throw new Error(`Expected method name for ctx ${context.name}`)
    }

    const args = { ...params }
    if (ids?.length) args.ids = ids
    const allDocuments = await methodCall({ name: methodName, args })
    if (!allDocuments || typeof allDocuments !== 'object') {
      throw new Error(`Expected document map for ctx ${context.name}`)
    }

    for (const [documentContextName, documents = []] of Object.entries(
      allDocuments,
    )) {
      if (!Array.isArray(documents)) {
        throw new Error(
          `Expected documents array for ctx ${documentContextName}`,
        )
      }
      debug(
        methodName,
        `received ${documents.length} doc(s) for ${documentContextName}`,
        documents,
      )
      for (const document of documents) {
        if (!document?._id) throw new Error('Expected doc with _id to upsert')
        const documentId = document._id
        localCollection.upsert(documentId, { $set: { ...document } })
        document._id = documentId
      }
    }

    return allDocuments
  }
}

export const loadAllContentDocs = createAllContentDocsLoader()
