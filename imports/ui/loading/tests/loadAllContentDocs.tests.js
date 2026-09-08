/* eslint-env mocha */
import { loadAllContentDocs } from '../loadAllContentDocs'
import { expect } from 'chai'
import { RequestedDocsContext } from '../../../../tests/webapp-server-helpers'

describe(loadAllContentDocs.name, () => {
  beforeEach(() => {
    RequestedDocsContext.collection().remove({})
  })
  it('loads all docs by given context', async () => {
    const loaded = await loadAllContentDocs({
      context: RequestedDocsContext,
      collection: RequestedDocsContext.collection(),
    })
    const docs = loaded[RequestedDocsContext.name]

    expect(RequestedDocsContext.collection().find().count()).to.equal(3)
    expect(docs).to.deep.equal([
      { _id: 'fooDoc', test: 'foo' },
      { _id: 'barDoc', test: 'bar' },
      { _id: 'mooDoc', test: 'moo' },
    ])

    // local collection
    const localDocs = RequestedDocsContext.collection().find().fetch()
    expect(localDocs).to.deep.equal(docs)
  })
})
