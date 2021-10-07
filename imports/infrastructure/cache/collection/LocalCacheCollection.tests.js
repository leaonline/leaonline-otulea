/* eslint-env mocha */
import { expect } from 'chai'
import { Random } from 'meteor/random'
import { Mongo } from 'meteor/mongo'
import { LocalCacheCollection } from './LocalCacheCollection'
import { HTTP } from 'meteor/http'
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
    it('logs if the selector is not sufficient for fetching, returns undefined', function () {
      stub(HTTP, 'get', () => expect.fail())
      const collection = new LocalCacheCollection('/', message => {
        expect(message).to.equal('insufficient selector to fetch via HTTP')
      })
      expect(collection.findOne()).to.equal(undefined)
    })
    it('fetches the doc from the internally set url', function () {
      const doc = { _id: Random.id() }
      stub(HTTP, 'get', () => ({
        data: doc
      }))
      const collection = new LocalCacheCollection('/')
      expect(collection.findOne(doc._id)).to.deep.equal(doc)
    })
    it('catches a failed request', function (done) {
      const errorId = `expected error: ${Random.id()}`
      stub(HTTP, 'get', () => {
        throw new Error(errorId)
      })
      const collection = new LocalCacheCollection('/', error => {
        if (typeof error === 'string') return
        expect(error.message).to.equal(errorId)
        done()
      })
      expect(collection.findOne(Random.id())).to.deep.equal(undefined)
    })
  })
})
