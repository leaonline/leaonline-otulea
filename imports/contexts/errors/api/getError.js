import { Errors } from '../Errors'

export const getError = query => Errors.collection().findOne(query)
