/* eslint-env mocha */
import { expect } from 'chai'
import { Random } from 'meteor/random'
import { mockCollection, restoreCollection } from '../../../../tests/mockCollection'
import { stub, restoreAll } from '../../../../tests/helpers.tests'
import { Session } from '../Session'
import { Response } from '../../response/Response'
import { DocNotFoundError } from '../../errors/DocNotFoundError'

const cancelSession = Session.methods.cancel.run

describe(Session.methods.cancel.name, function () {
  before(function () {
    mockCollection(Session)
    mockCollection(Response)
  })

  after(function () {
    restoreCollection(Session)
    restoreCollection(Response)
  })

  let sessionId
  let userId

  beforeEach(function () {
    sessionId = Random.id()
    userId = Random.id()
  })

  afterEach(function () {
    restoreAll()
    Session.collection().remove({})
    Response.collection().remove({})
  })
  it('throws if there is no sessionDoc by id', function () {
    stub(Session, 'collection', () => ({ findOne: () => {} }))
    const env = { userId }
    const arg = { sessionId }
    expect(() => cancelSession.call(env, arg)).to.throw(DocNotFoundError.reason)
  })
  it('deletes the sessionDoc if its empty', function () {
    const doc = { _id: sessionId }
    stub(Session, 'collection', () => ({
      findOne: () => doc,
      remove: id => {
        expect(id).to.deep.equal(sessionId)
        return 1
      }
    }))
    stub(Response, 'collection', () => ({ find: () => ({ count: () => 0 }) }))
    const env = { userId }
    const arg = { sessionId }
    const removed = cancelSession.call(env, arg)
    expect(removed).to.equal(1)
  })
  it('sets the sessionDoc as cancelled if not empty', function () {
    const doc = { _id: sessionId, progress: 1 }
    stub(Session, 'collection', () => ({
      findOne: () => doc,
      update: (id, modifier) => {
        expect(id).to.deep.equal(sessionId)
        expect(modifier.$set.cancelledAt instanceof Date).to.equal(true)
        return 1
      }
    }))
    stub(Response, 'collection', () => ({ find: () => ({ count: () => 1 }) }))
    const env = { userId }
    const arg = { sessionId }
    const updated = cancelSession.call(env, arg)
    expect(updated).to.equal(1)
  })
})
