/* eslint-env mocha */
import { LocalCacheCollection } from './LocalCacheCollection'

describe(LocalCacheCollection.name, function () {
  it('extends a Mongo.Collection')
  it('resolve url by passed context')

  describe(LocalCacheCollection.prototype.findOne.name, function () {
    it('returns the doc, if it already exists')
    it('throws if the selector is not sufficient for fetching')
    it('fetches the doc from the internally set url')
  })
})
