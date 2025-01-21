/* eslint-env mocha */
import { expect } from 'chai'
import { Random } from 'meteor/random'
import { UnitSet } from '../../unitSet/UnitSet'
import {
  clearCollection,
  mockCollection,
  restoreCollection
} from '../../../../tests/mockCollection'
import { Session } from '../Session'
import { TestCycle } from '../../testcycle/TestCycle'
import { expectThrow, restoreAll, stub } from '../../../../tests/helpers.tests'
import { DocNotFoundError } from '../../errors/DocNotFoundError'

const continueSession = Session.methods.continue.run

describe(Session.methods.continue.name, async () => {
  before(async () => {
    mockCollection(Session)
    mockCollection(TestCycle)
    mockCollection(UnitSet)
  })

  after(async () => {
    restoreCollection(Session)
    restoreCollection(TestCycle)
    restoreCollection(UnitSet)
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
    await clearCollection(TestCycle)
    await clearCollection(UnitSet)
  })

  it('throws if there is no sessionDoc for sessionId', async () => {
    stub(Session, 'collection', () => ({ findOneAsync: async () => {} }))

    const env = { userId }
    const arg = { sessionId }
    await expectThrow({
      fn: () => continueSession.call(env, arg),
      message: DocNotFoundError.reason
    })
  })

  it('throws if the session is already complete', async () => {
    const doc = { completedAt: new Date() }
    stub(Session, 'collection', () => ({ findOneAsync: async () => doc }))

    const env = { userId }
    const arg = { sessionId }

    await expectThrow({
      fn: () => continueSession.call(env, arg),
      message: 'session.isComplete'
    })
  })
  it('throws if the session is already cancelled', async () => {
    const doc = { cancelledAt: new Date() }
    stub(Session, 'collection', () => ({ findOneAsync: async () => doc }))

    const env = { userId }
    const arg = { sessionId }
    await expectThrow({
      fn: () => continueSession.call(env, arg),
      message: 'session.isCancelled'
    })
  })
  it('updates the session accordingly and returns the doc', async () => {
    const doc = { _id: sessionId }
    stub(Session, 'collection', () => ({
      findOneAsync: async () => doc,
      updateAsync: async (id, modifier) => {
        expect(id).to.equal(sessionId)
        expect(modifier.$set.continuedAt instanceof Date).to.equal(true)
        return 1
      }
    }))

    const env = { userId }
    const arg = { sessionId }
    const updated = await continueSession.call(env, arg)
    expect(updated).to.deep.equal(doc)
  })
})
