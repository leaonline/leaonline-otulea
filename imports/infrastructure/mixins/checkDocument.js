import { DocumentNotFoundError } from '../../api/errors/DocumentNotFoundError'

export const checkDocument = (document, context, details = undefined) => {
  if (!document) {
    throw new DocumentNotFoundError(context.name, details)
  }
}
