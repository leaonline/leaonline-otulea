import { DocumentNotFoundError } from '../errors/DocumentNotFoundError'

export const createValidateDoc = context => {
  return function validateDoc (document) {
    if (!document) {
      throw new DocumentNotFoundError(context.name)
    }
    return document
  }

}