/* eslint-env mocha */
import { expect } from 'chai'
import { Mongo } from 'meteor/mongo'
import sinon from 'sinon'
import {
  createAllContentDocsLoader,
  loadAllContentDocs,
} from '../loadAllContentDocs'
import { RequestedDocsContext } from '../../../../tests/webapp-server-helpers'

const getError = async (callback) => {
  try {
    await callback()
  } catch (error) {
    return error
  }
  expect.fail('expected callback to reject')
}

describe('loadAllContentDocs', () => {
  beforeEach(() => RequestedDocsContext.collection().remove({}))

  it('loads all docs by the registered current method', async () => {
    const loaded = await loadAllContentDocs({
      context: RequestedDocsContext,
      collection: RequestedDocsContext.collection(),
    })
    expect(loaded[RequestedDocsContext.name]).to.have.lengthOf(3)
    expect(RequestedDocsContext.collection().find().count()).to.equal(3)
  })

  it('validates context, collection and method', async () => {
    expect((await getError(() => loadAllContentDocs({}))).message).to.equal(
      'Context is expected',
    )
    const context = { name: 'docs', methods: {} }
    expect(
      (await getError(() => loadAllContentDocs({ context }))).message,
    ).to.include('Expected collection')
    expect(
      (
        await getError(() =>
          loadAllContentDocs({ context, collection: new Mongo.Collection(null) }),
        )
      ).message,
    ).to.include('Expected method name')
  })

  it('reuses complete all-document and id-subset caches', async () => {
    const collection = new Mongo.Collection(null)
    collection.insert({ _id: 'one' })
    collection.insert({ _id: 'two' })
    const methodCall = sinon.spy()
    const loader = createAllContentDocsLoader({ methodCall })
    const context = { name: 'docs', methods: { getAll: 'docs.getAll' } }

    expect(
      (await loader({ context, collection, unlessExists: true })).docs,
    ).to.have.lengthOf(2)
    expect(
      (
        await loader({
          context,
          collection,
          ids: ['one', 'two'],
          unlessExists: true,
        })
      ).docs,
    ).to.have.lengthOf(2)
    expect(methodCall.called).to.equal(false)
  })

  it('merges id subsets into params and upserts returned documents', async () => {
    const collection = new Mongo.Collection(null)
    const methodCall = sinon.stub().resolves({
      docs: [
        { _id: 'one', value: 1 },
        { _id: 'two', value: 2 },
      ],
    })
    const loader = createAllContentDocsLoader({ methodCall })
    const context = { name: 'docs', methods: { getAll: 'docs.getAll' } }

    const result = await loader({
      context,
      collection,
      ids: ['one', 'two'],
      params: { dependencies: [{ name: 'other' }] },
    })

    expect(methodCall.firstCall.args[0]).to.deep.equal({
      name: 'docs.getAll',
      args: {
        dependencies: [{ name: 'other' }],
        ids: ['one', 'two'],
      },
    })
    expect(result.docs).to.have.lengthOf(2)
    expect(collection.find().count()).to.equal(2)
  })

  it('accepts empty maps and rejects malformed result shapes', async () => {
    const collection = new Mongo.Collection(null)
    const methodCall = sinon.stub().resolves({})
    const loader = createAllContentDocsLoader({ methodCall })
    const context = { name: 'docs', methods: { getAll: 'docs.getAll' } }

    expect(await loader({ context, collection })).to.deep.equal({})
    for (const malformed of [
      undefined,
      { docs: {} },
      { docs: [{ value: 'missing id' }] },
    ]) {
      methodCall.resolves(malformed)
      expect(await getError(() => loader({ context, collection }))).to.exist
    }
  })
})
