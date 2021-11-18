/* eslint-env mocha */
import { expect } from 'chai'
import { Random } from 'meteor/random'
import { Mongo } from 'meteor/mongo'
import { EJSON } from 'meteor/ejson'
import { HTTP } from 'meteor/jkuester:http'
import { LocalCacheCollection } from './LocalCacheCollection'
import { restoreAll, stub } from '../../../../tests/helpers.tests'

describe(LocalCacheCollection.name, function () {
  it('extends a Mongo.Collection', function () {
    const collection = new LocalCacheCollection('/', () => {})
    expect(collection instanceof Mongo.Collection).to.equal(true)
  })

  describe(LocalCacheCollection.prototype.findOne.name, function () {
    afterEach(function () {
      restoreAll()
    })
    it('returns the doc, if it already exists', function () {
      stub(HTTP, 'get', () => expect.fail())
      const collection = new LocalCacheCollection('/', (...args) => console.warn(args))
      const doc = { _id: Random.id() }
      collection.insert(doc)
      expect(collection.find().count()).to.equal(1)
      expect(collection.findOne()).to.deep.equal(doc)
    })
    it('throws, if the selector is not sufficient for fetching, returns undefined', function () {
      stub(HTTP, 'get', () => expect.fail())
      const collection = new LocalCacheCollection('/')
      expect(() => collection.findOne()).to.throw('insufficient selector to fetch via HTTP')
    })
    it('fetches the doc from the internally set url', function () {
      const doc = {
        _id: Random.id(),
        content: EJSON.stringify([{ response: /0/ }])
      }
      stub(HTTP, 'get', () => ({
        data: { _id: doc._id, content: EJSON.parse(doc.content )}
      }))
      const collection = new LocalCacheCollection('/')
      const doc2 = collection.findOne(doc._id)
      console.debug({ doc2 })
      expect(doc2._id).to.equal(doc._id)
      expect(doc2.content).to.deep.equal([{ response: /0/ }])
    })
    it('throw on a failed request', function () {
      const errorId = `expected error: ${Random.id()}`
      stub(HTTP, 'get', () => {
        throw new Error(errorId)
      })
      const collection = new LocalCacheCollection('/', )
      expect(() => collection.findOne(Random.id()))
        .to.throw(errorId)
    })
  })
})
