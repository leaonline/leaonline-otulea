import { Errors } from '../Errors'

/**
 * Saves a normalized error to collection but increments the counter, in case
 * the error already exists and varies only by user and timestamp.
 *
 * Requires the errorDoc to be normalized!
 *
 * @param normalizedErrorDoc
 * @return {*}
 */
export const persistError = normalizedErrorDoc => {
  // let's see, if the same user created the same error already
  const { hash } = normalizedErrorDoc
  const collection = Errors.collection()
  const existingError = collection.findOne({ hash })

  if (existingError) {
    return collection.update(existingError._id, {
      $inc: { count: 1 }
    })
  }

  normalizedErrorDoc.count = 1

  return collection.insert(normalizedErrorDoc)
}
