/* eslint-env mocha */
import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { expect } from 'chai'
import { Random } from 'meteor/random'
import { createCollection } from './createCollection'

const routes = {
  byId: {
    path: '/'
  }
}
const debug = () => {}

describe(createCollection.name, function () {
  if (Meteor.isServer) {
    it('creates a local collection, if flagged as such', function () {
      const ctx = {
        name: Random.id(),
        isLocalCollection: true,
        routes,
        schema: {}
      }
      const local = createCollection(ctx, debug)
      expect(local instanceof Mongo.Collection).to.equal(true)
      expect(local._name).to.equal(ctx.name)
      expect(ctx.collection()).to.equal(local)
    })
  }

  if (Meteor.isClient) {
    it('creates a plain local collection on the client, if flagged as such', function () {
      const ctx = {
        name: Random.id(),
        isLocalCollection: true,
        schema: {}
      }
      const local = createCollection(ctx, debug)
      expect(local instanceof Mongo.Collection).to.equal(true)
      expect(local._name).to.equal(ctx.name)
      expect(ctx.collection()).to.equal(local)
    })
  }

  it('creates a standard collection, if not flagged as local', function () {
    const collectionName = Random.id()
    const ctx = {
      name: collectionName,
      schema: {}
    }
    const collection = createCollection(ctx, debug)
    expect(collection instanceof Mongo.Collection).to.equal(true)
    expect(collection._name).to.equal(collectionName)
    expect(ctx.collection()).to.equal(collection)
  })
})
