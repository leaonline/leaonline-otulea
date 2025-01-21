/* eslint-env mocha */
import { expect } from 'chai'
import { Random } from 'meteor/random'
import { Mongo } from 'meteor/mongo'
import { EJSON } from 'meteor/ejson'
import { HTTP } from 'meteor/jkuester:http'
import { LocalCacheCollection } from './LocalCacheCollection'
import { expectThrow, restoreAll, stub } from '../../../../tests/helpers.tests'

describe(LocalCacheCollection.name, async () => {
  it('extends a Mongo.Collection', async () => {
    const collection = new LocalCacheCollection('/', () => {})
    expect(collection instanceof Mongo.Collection).to.equal(true)
  })

  describe(LocalCacheCollection.prototype.findOneAsync.name, async () => {
    afterEach(async () => {
      restoreAll()
    })
    it('returns the doc, if it already exists', async () => {
      stub(HTTP, 'get', () => expect.fail())
      const collection = new LocalCacheCollection('/', (...args) => console.warn(args))
      const doc = { _id: Random.id() }
      await collection.insertAsync(doc)
      expect(await collection.countDocuments({})).to.equal(1)
      expect(await collection.findOneAsync()).to.deep.equal(doc)
    })
    it('throws, if the selector is not sufficient for fetching, returns undefined', async () => {
      stub(HTTP, 'get', () => expect.fail())
      const collection = new LocalCacheCollection('/')
      await expectThrow({
        fn: () => collection.findOneAsync(),
        message: 'insufficient selector to fetch via HTTP'
      })
    })
    it('fetches the doc from the internally set url', async () => {
      const doc = {
        _id: Random.id(),
        content: EJSON.stringify([{ response: /0/ }])
      }
      stub(HTTP, 'get', () => ({
        data: { _id: doc._id, content: EJSON.parse(doc.content) }
      }))
      const collection = new LocalCacheCollection('/')
      const doc2 = await collection.findOneAsync(doc._id)
      console.debug({ doc2 })
      expect(doc2._id).to.equal(doc._id)
      expect(doc2.content).to.deep.equal([{ response: /0/ }])
    })
    it('throw on a failed request', async () => {
      const errorId = `expected error: ${Random.id()}`
      stub(HTTP, 'get', () => {
        throw new Error(errorId)
      })
      const collection = new LocalCacheCollection('/')
      await expectThrow({
        fn: () => collection.findOneAsync(Random.id()),
        message: errorId
      })
    })
  })
})
