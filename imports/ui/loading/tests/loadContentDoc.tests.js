/* eslint-env mocha */
import { loadContentDoc } from '../loadContentDoc'
import { expect } from 'chai'
import { RequestedDocsContext } from '../../../../tests/webapp-server-helpers'
import { mockCollection, restoreCollection } from '../../../../tests/mockCollection'

describe(loadContentDoc.name, function () {
  before(() => {
    mockCollection(RequestedDocsContext)
  })
  beforeEach(function () {
    RequestedDocsContext.collection().remove({})
  })
  after(() => {
    restoreCollection(RequestedDocsContext)
  })
  it('loads a single document from the content server', async function () {
    const doc = await loadContentDoc({ context: RequestedDocsContext, query: { test: 'foo' }})
    expect(doc).to.deep.equal({ _id: 'fooDoc', test: 'foo' })

    // local collection
    const localDoc = RequestedDocsContext.collection().findOne(docId)
    expect(localDoc).to.deep.equal(doc)

    // cached response
    const cachedDoc = await loadContentDoc({ context: RequestedDocsContext, query: { test: 'foo' }})
    expect(cachedDoc).to.deep.equal(doc)
    expect(RequestedDocsContext.collection().find().count()).to.equal(1)
  })
})
