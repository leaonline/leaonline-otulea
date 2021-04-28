import { Errors } from '../Errors'

const transform = { hint: { $natural: -1 } }

export const getAllErrors = ids => {
  if (ids && !Array.isArray(ids)) {
    throw new Meteor.Error('errors.getAll.error', 'errors.getAll.arrayExpected', { ids })
  }

  const query = {}

  if (ids) {
    query._id = { $in: ids }
  }

  return Errors.collection().find(query, transform).fetch()
}