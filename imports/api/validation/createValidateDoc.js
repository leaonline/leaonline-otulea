import { DocumentNotFoundError } from '../errors/DocumentNotFoundError'

/**
 * @deprecated use checkDocument
 * @param context
 * @return {function(*=): *}
 */
export const createValidateDoc = context => {
  return function validateDoc (document) {
    if (!document) {
      throw new DocumentNotFoundError(context.name)
    }
    return document
  }
}
