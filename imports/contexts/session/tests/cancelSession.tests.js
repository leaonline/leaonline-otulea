/* eslint-env mocha */
import { expect } from 'chai'
import { Random } from 'meteor/random'
import { clearCollection, mockCollection, restoreCollection } from '../../../../tests/mockCollection'
import { stub, restoreAll, expectThrow } from '../../../../tests/helpers.tests'
import { Session } from '../Session'
import { Response } from '../../response/Response'
import { DocNotFoundError } from '../../errors/DocNotFoundError'

const cancelSession = Session.methods.cancel.run

describe(Session.methods.cancel.name, async () => {
  before(async () => {
    mockCollection(Session)
    mockCollection(Response)
  })

  after(async () => {
    restoreCollection(Session)
    restoreCollection(Response)
  })

  let sessionId
  let userId

  beforeEach(async () => {
    sessionId = Random.id()
    userId = Random.id()
  })

  afterEach(async () => {
    restoreAll()
    await clearCollection(Session)
    await clearCollection(Response)
  })
  it('throws if there is no sessionDoc by id', async () => {
    stub(Session, 'collection', () => ({ findOneAsync: async () => {} }))
    const env = { userId }
    const arg = { sessionId }
    await expectThrow({
      fn: () => cancelSession.call(env, arg),
      message: DocNotFoundError.reason
    })
  })
  it('deletes the sessionDoc if its empty', async () => {
    const doc = { _id: sessionId }
    stub(Session, 'collection', () => ({
      findOneAsync: async () => doc,
      removeAsync: async id => {
        expect(id).to.deep.equal(sessionId)
        return 1
      }
    }))
    stub(Response, 'collection', () => ({ countDocuments: async () => 0 }))
    const env = { userId }
    const arg = { sessionId }
    const removed = await cancelSession.call(env, arg)
    expect(removed).to.equal(1)
  })
  it('sets the sessionDoc as cancelled if not empty', async () => {
    const doc = { _id: sessionId, progress: 1 }
    stub(Session, 'collection', () => ({
      findOneAsync: async () => doc,
      updateAsync: async (id, modifier) => {
        expect(id).to.deep.equal(sessionId)
        expect(modifier.$set.cancelledAt instanceof Date).to.equal(true)
        return 1
      }
    }))
    stub(Response, 'collection', () => ({ countDocuments: async () => 1 }))
    const env = { userId }
    const arg = { sessionId }
    const updated = await cancelSession.call(env, arg)
    expect(updated).to.equal(1)
  })
})
