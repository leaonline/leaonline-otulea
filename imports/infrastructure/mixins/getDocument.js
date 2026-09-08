/**
 * Simple wrapper to return a document by id and given context.
 * @async
 * @param docId
 * @param context
 * @return {Promise<object|undefined>}
 */
export const getDocument = (docId, context) =>
  context.collection().findOneAsync(docId)
