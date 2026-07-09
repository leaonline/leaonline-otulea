import { onServer } from '../../utils/archUtils'
import { getCollection } from '../../infrastructure/collections/getCollection'
import { createLog } from "../../utils/createLog";

export const createGetMethod = ({ context, schema, run, backendOnly = true, debug, ...additionalMixins }) => {
    const methodName = `${context.name}.methods.get`
    const prefix = `[${context.name}][${methodName}]:`
    const _debug = debug ?? createLog({ name: context.name, level: 'debug' })
    return {
    name: methodName,
    backend: backendOnly,
    schema: {
      _id: String,
      ...schema
    },
    run: onServer(run || async function (query) {
        const document = await getCollection(context.name).findOneAsync(query)
        _debug(prefix, JSON.stringify(query, null, 0), `found=${!!document}`)
        return document
    }),
    ...additionalMixins
  }
}
