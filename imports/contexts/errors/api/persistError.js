import { Errors } from '../Errors'

/**
 * Saves an erorr to collection but increments the counter, in case the error
 * already exists and varies only by user and timestamp.
 *
 * Requires the errorDoc to be normalized!
 *
 * @param normalizedErrorDoc
 * @return {*}
 */
export const persistError = normalizedErrorDoc => {
  // let's see, if the same user created the same error already
  const { hash } = normalizedErrorDoc
  const existingError = Errors.collection().findOne({ hash })

  if (existingError) {
    return Errors.collection().update(existingError._id, {
      $inc: existingError.count
    })
  }

  return Errors.collection().insert(normalizedErrorDoc)
}
