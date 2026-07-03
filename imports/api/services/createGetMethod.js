import { onServer } from '../../utils/archUtils'
import { getCollection } from '../../infrastructure/collections/getCollection'

export const createGetMethod = ({ context, schema, run, backendOnly = true }) => {
  return {
    name: `${context.name}.methods.get`,
    backend: backendOnly,
    schema: {
      _id: String,
      ...schema
    },
    run: onServer(run || async function (query) {
      return getCollection(context.name).findOneAsync(query)
    })
  }
}
