import { Mongo } from 'meteor/mongo'
import { createGetMethod } from '../imports/api/services/createGetMethod'
import { createGetAllMethod } from '../imports/api/services/createGetAllMethod'
import { onServerExec } from '../imports/utils/archUtils'

export const RequestedDocsContext = {
  name: '__test__requested_docs_content',
  schema: {
    test: String
  },
  methods: {}
}

RequestedDocsContext.methods.get = createGetMethod({
  context: RequestedDocsContext,
  schema: {
    test: String
  },
  backendOnly: false,
  isPublic: true
})

RequestedDocsContext.methods.getAll = createGetAllMethod({
  context: RequestedDocsContext,
  schema: {
    test: String
  },
  backendOnly: false,
  isPublic: true
})

const _singleDocCollection = new Mongo.Collection(null)
RequestedDocsContext.collection = () => _singleDocCollection

onServerExec(() => {
  import { createMethod } from '../imports/infrastructure/factories/method/createMethods'

  createMethod(RequestedDocsContext.methods.get)
  createMethod(RequestedDocsContext.methods.getAll)

  const init = async () => {
    await RequestedDocsContext.collection().insertAsync({ _id: 'fooDoc', test: 'foo' })
    await RequestedDocsContext.collection().insertAsync({ _id: 'barDoc', test: 'bar' })
    await RequestedDocsContext.collection().insertAsync({ _id: 'mooDoc', test: 'moo' })
  }
  init().catch(console.error)
})
