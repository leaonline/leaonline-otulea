import { DocumentNotFoundError } from '../../api/errors/DocumentNotFoundError'

/**
 *
 * @param document
 * @param context
 * @param details
 */
export const checkDocument = (document, context, details = undefined) => {
  if (!document) {
    throw new DocumentNotFoundError(context.name, details)
  }
}
