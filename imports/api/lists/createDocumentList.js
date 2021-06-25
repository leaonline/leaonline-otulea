import { DocumentList } from './DocumentList'

/**
 * Creates a new document list with an initial set of values. Will trigger all
 * internal validations. The returned doc can be assumed as valid.
 *
 * @param currentId
 * @param document
 * @param context
 * @param fieldName
 * @return {DocumentList}
 */
export const createDocumentList = ({ currentId, document, context, fieldName }) => {
  const docList = new DocumentList({ context, fieldName })
  docList.setDocument(document)
  docList.setCurrent(currentId)
  return docList
}
