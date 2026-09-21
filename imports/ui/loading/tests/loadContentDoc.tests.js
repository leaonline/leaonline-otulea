/* eslint-env mocha */
import { expect } from 'chai'
import { Mongo } from 'meteor/mongo'
import sinon from 'sinon'
import {
  createContentDocLoader,
  loadContentDoc,
} from '../loadContentDoc'
import { RequestedDocsContext } from '../../../../tests/webapp-server-helpers'
import {
  mockCollection,
  restoreCollection,
} from '../../../../tests/mockCollection'

const getError = async (callback) => {
  try {
    await callback()
  } catch (error) {
    return error
  }
  expect.fail('expected callback to reject')
}

describe('loadContentDoc', () => {
  before(() => mockCollection(RequestedDocsContext))
  beforeEach(() => RequestedDocsContext.collection().remove({}))
  after(() => restoreCollection(RequestedDocsContext))

  it('loads a current document and caches it locally', async () => {
    const document = await loadContentDoc({
      context: RequestedDocsContext,
      query: { test: 'foo' },
    })
    expect(document).to.deep.equal({ _id: 'fooDoc', test: 'foo' })
    expect(RequestedDocsContext.collection().findOne('fooDoc')).to.deep.equal(
      document,
    )
  })

  it('validates context, collection, method and route type', async () => {
    expect((await getError(() => loadContentDoc({}))).message).to.equal(
      'Context is expected',
    )
    const context = { name: 'missing', methods: {} }
    expect(
      (await getError(() => loadContentDoc({ context, query: {} }))).message,
    ).to.include('Expected collection')

    const collection = new Mongo.Collection(null)
    expect(
      (
        await getError(() =>
          loadContentDoc({ context, collection, query: {} }),
        )
      ).message,
    ).to.include('Expected method name')
    context.methods.get = 'missing.get'
    expect(
      (
        await getError(() =>
          loadContentDoc({ context, collection, query: {}, from: 'invalid' }),
        )
      ).message,
    ).to.include('Expected loader')
  })

  it('uses a cached document without calling the method', async () => {
    const collection = new Mongo.Collection(null)
    collection.insert({ _id: 'cached', value: 1 })
    const methodCall = sinon.spy()
    const loader = createContentDocLoader({ methodCall })

    const document = await loader({
      context: { name: 'docs', methods: { get: 'docs.get' } },
      collection,
      query: { _id: 'cached' },
      unlessExists: true,
    })

    expect(document).to.deep.equal({ _id: 'cached', value: 1 })
    expect(methodCall.called).to.equal(false)
  })

  it('loads the selected current method and rejects malformed documents', async () => {
    const collection = new Mongo.Collection(null)
    const methodCall = sinon.stub().resolves({ _id: 'one', value: 1 })
    const loader = createContentDocLoader({ methodCall })
    const context = { name: 'docs', methods: { get: 'docs.get' } }

    expect(
      await loader({ context, collection, name: 'custom.get', query: { x: 1 } }),
    ).to.deep.equal({ _id: 'one', value: 1 })
    expect(methodCall.firstCall.args[0]).to.deep.equal({
      name: 'custom.get',
      args: { x: 1 },
    })

    methodCall.resolves({ value: 'missing id' })
    expect(
      (
        await getError(() => loader({ context, collection, query: { x: 2 } }))
      ).message,
    ).to.include('Expected document with _id')
  })

  it('supports optional and required not-found behavior', async () => {
    const collection = new Mongo.Collection(null)
    const loader = createContentDocLoader({
      methodCall: sinon.stub().resolves(undefined),
    })
    const context = { name: 'docs', methods: { get: 'docs.get' } }

    expect(await loader({ context, collection, query: {} })).to.equal(undefined)
    expect(
      (
        await getError(() =>
          loader({ context, collection, query: { _id: 'x' }, throwIfNotFound: true }),
        )
      ).message,
    ).to.include('Expected document for ctx docs')
  })

  it('selects remote id/code routes, caches results and exposes HTTP errors', async () => {
    const collection = new Mongo.Collection(null)
    const http = sinon.stub().resolves({
      statusCode: 200,
      data: { _id: 'remote', value: 1 },
    })
    const loader = createContentDocLoader({
      http,
      contentBase: 'https://content.example.test',
    })
    const context = {
      name: 'docs',
      methods: { get: 'docs.get' },
      routes: { byId: { path: '/by-id' }, byCode: { path: '/by-code' } },
    }

    await loader({ context, collection, query: { _id: 'remote' }, from: 'remote' })
    expect(http.firstCall.args).to.deep.equal([
      'GET',
      'https://content.example.test/by-id?_id=remote',
    ])
    expect(collection.findOne('remote')).to.include({ value: 1 })

    http.resetHistory()
    await loader({
      context,
      collection,
      query: { shortCode: 'ABC' },
      from: 'remote',
    })
    expect(http.firstCall.args[1]).to.equal(
      'https://content.example.test/by-code?shortCode=ABC',
    )

    http.resolves({ statusCode: 503, content: ' unavailable' })
    expect(
      (
        await getError(() =>
          loader({ context, collection, query: { _id: 'x' }, from: 'remote' }),
        )
      ).message,
    ).to.equal('503 unavailable')
  })
})
