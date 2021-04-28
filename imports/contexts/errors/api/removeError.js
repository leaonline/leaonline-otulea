import { Errors } from '../Errors'

export const removeError = query => Errors.collection().remove(query)
