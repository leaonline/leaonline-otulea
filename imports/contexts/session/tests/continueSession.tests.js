/* eslint-env mocha */
import { expect } from 'chai'
import { Random } from 'meteor/random'
import { continueSession } from '../api/continueSession'
import { UnitSet } from '../../unitSet/UnitSet'
import {
  mockCollection,
  restoreCollection
} from '../../../../tests/mockCollection'
import { Session } from '../Session'
import { TestCycle } from '../../testcycle/TestCycle'
import { restoreAll, stub } from '../../../../tests/helpers.tests'
import { DocNotFoundError } from '../../errors/DocNotFoundError'

describe(continueSession.name, function () {
  let sessionId
  let userId
  beforeEach(function () {
    mockCollection(Session)
    mockCollection(TestCycle)
    mockCollection(UnitSet)
    sessionId = Random.id()
    userId = Random.id()
  })

  afterEach(function () {
    restoreCollection(Session)
    restoreAll()
  })

  it('throws if there is no sessionDoc for sessionId', function () {
    stub(Session, 'collection', () => ({ findOne: () => {} }))

    const options = { sessionId, userId }
    expect(() => continueSession(options)).to.throw(DocNotFoundError.reason)
  })

  it('throws if the session is already complete', function () {
    const doc = { completedAt: new Date() }
    stub(Session, 'collection', () => ({ findOne: () => doc }))

    const options = { sessionId, userId }
    expect(() => continueSession(options)).to.throw('session.isComplete')
  })
  it('throws if the session is already cancelled', function () {
    const doc = { cancelledAt: new Date() }
    stub(Session, 'collection', () => ({ findOne: () => doc }))

    const options = { sessionId, userId }
    expect(() => continueSession(options)).to.throw('session.isCancelled')
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

    const options = { sessionId, userId }
    const updated = continueSession(options)
    expect(updated).to.deep.equal(doc)
  })
})
