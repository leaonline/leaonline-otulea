/* eslint-env mocha */
import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { expect } from 'chai'
import { Random } from 'meteor/random'
import { createCollection } from './createCollection'
import { LocalCacheCollection } from '../../cache/collection/LocalCacheCollection'

const routes = {
  byId: {
    path: '/'
  }
}
describe(createCollection.name, function () {
  if (Meteor.isServer) {
    it('creates a LocalCachedCollection, if flagged as such', function () {
      const ctx = {
        name: Random.id(),
        isLocalCollection: true,
        routes,
        schema: {}
      }

      const local = createCollection(ctx)
      expect(local instanceof LocalCacheCollection).to.equal(true)
      expect(local instanceof Mongo.Collection).to.equal(true)
      expect(local._name).to.equal(null)

      expect(ctx.collection()).to.equal(local)
    })
  }

  if (Meteor.isClient) {
    it('creates a plain localcollection on the client, if flagged as such', function () {
      const ctx = {
        name: Random.id(),
        isLocalCollection: true,
        schema: {}
      }
      const local = createCollection(ctx)
      expect(local instanceof LocalCacheCollection).to.equal(false)
      expect(local instanceof Mongo.Collection).to.equal(true)
      expect(local._name).to.equal(null)
      expect(ctx.collection()).to.equal(local)
    })
  }

  it('creates a standard collection, if not flagged as local', function () {
    const collectionName = Random.id()
    const ctx = {
      name: collectionName,
      schema: {}
    }
    const collection = createCollection(ctx)
    expect(collection instanceof LocalCacheCollection).to.equal(false)
    expect(collection instanceof Mongo.Collection).to.equal(true)
    expect(collection._name).to.equal(collectionName)
    expect(ctx.collection()).to.equal(collection)
  })
})
