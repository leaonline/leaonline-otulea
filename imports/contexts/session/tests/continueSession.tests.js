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
import { restoreAll, stub } from '../../../../tests/helpers.tests'
import { DocNotFoundError } from '../../errors/DocNotFoundError'

const continueSession = Session.methods.continue.run

describe(Session.methods.continue.name, function () {
  before(function () {
    mockCollection(Session)
    mockCollection(TestCycle)
    mockCollection(UnitSet)
  })

  after(function () {
    restoreCollection(Session)
    restoreCollection(TestCycle)
    restoreCollection(UnitSet)
  })

  let sessionId
  let userId

  beforeEach(function () {
    sessionId = Random.id()
    userId = Random.id()
  })

  afterEach(function () {
    restoreAll()
    clearCollection(Session)
    clearCollection(TestCycle)
    clearCollection(UnitSet)
  })

  it('throws if there is no sessionDoc for sessionId', function () {
    stub(Session, 'collection', () => ({ findOne: () => {} }))

    const env = { userId }
    const arg = { sessionId }
    expect(() => continueSession.call(env, arg)).to.throw(DocNotFoundError.reason)
  })

  it('throws if the session is already complete', function () {
    const doc = { completedAt: new Date() }
    stub(Session, 'collection', () => ({ findOne: () => doc }))

    const env = { userId }
    const arg = { sessionId }
    expect(() => continueSession.call(env, arg)).to.throw('session.isComplete')
  })
  it('throws if the session is already cancelled', function () {
    const doc = { cancelledAt: new Date() }
    stub(Session, 'collection', () => ({ findOne: () => doc }))

    const env = { userId }
    const arg = { sessionId }
    expect(() => continueSession.call(env, arg)).to.throw('session.isCancelled')
  })
  it('updates the session accordingly and returns the doc', function () {
    const doc = { _id: sessionId }
    stub(Session, 'collection', () => ({
      findOne: () => doc,
      update: (id, modifier) => {
        expect(id).to.equal(sessionId)
        expect(modifier.$set.continuedAt instanceof Date).to.equal(true)
        return 1
      }
    }))

    const env = { userId }
    const arg = { sessionId }
    const updated = continueSession.call(env, arg)
    expect(updated).to.deep.equal(doc)
  })
})
