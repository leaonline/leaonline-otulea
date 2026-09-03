/* eslint-env mocha */
import { Meteor } from 'meteor/meteor'
import { expect } from 'chai'
import { Random } from 'meteor/random'
import {
  clearCollection,
  mockCollection,
  restoreCollection,
} from '../../../../tests/mockCollection'
import { stub, restoreAll, expectThrow } from '../../../../tests/helpers.tests'
import { Session } from '../Session'
import { TestCycle } from '../../testcycle/TestCycle'
import { Feedback } from '../../feedback/Feedback'

const getResults = Session.methods.results.run

describe(Session.methods.results.name, async () => {
  before(async () => {
    mockCollection(Session)
    mockCollection(TestCycle)
    mockCollection(Feedback)
  })

  after(async () => {
    restoreCollection(Session)
    restoreCollection(TestCycle)
    restoreCollection(Feedback)
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
    await clearCollection(Feedback)
  })

  it('throws if no session doc is found', async () => {
    const env = { userId }
    const arg = { sessionId }
    await expectThrow({
      fn: () => getResults.call(env, arg),
      reason: 'generateFeedback.sessionNotFound',
      details: { userId, sessionId },
    })
  })
  it('throws if no test cycle doc is found', async () => {
    const sessionDoc = {
      testCycle: Random.id(),
      completedAt: new Date(),
      progress: 13,
      maxProgress: 1357911,
    }
    stub(Session, 'collection', () => ({
      findOneAsync: async () => sessionDoc,
    }))
    const env = { userId }
    const arg = { sessionId }
    await expectThrow({
      fn: () => getResults.call(env, arg),
      error: 'generateFeedback.error',
      reason: 'generateFeedback.testCycleNotFound',
      details: {
        userId,
        sessionId,
        testCycle: sessionDoc.testCycle,
        completedAt: sessionDoc.completedAt,
        progress: sessionDoc.progress,
        maxProgress: sessionDoc.maxProgress,
      },
    })
  })
  it('adds a new Record if the feedback doc is not fromDB', async () => {
    const sessionDoc = {
      _id: sessionId,
      testCycle: Random.id(),
      completedAt: new Date(),
      progress: 13,
      maxProgress: 1357911,
    }
    const testCycleDoc = { _id: sessionDoc.testCycle }
    const feedbackDoc = { fromDB: false, sessionDoc, testCycleDoc, userId }
    stub(Session, 'collection', () => ({
      findOneAsync: async () => sessionDoc,
    }))
    stub(TestCycle, 'collection', () => ({
      findOneAsync: async () => testCycleDoc,
    }))
    stub(Feedback, 'collection', () => ({
      findOneAsync: async () => feedbackDoc,
    }))
    const deferred = stub(Meteor, 'defer', () => {})
    const env = { userId, debug: console.debug, flagFromDb: false }
    const arg = { sessionId }
    await getResults.call(env, arg)
    expect(deferred.calledOnce).to.equal(true)
  })
})
