/* eslint-env mocha */
import { Meteor } from 'meteor/meteor'
import { expect } from 'chai'
import { Random } from 'meteor/random'
import {
  clearCollection,
  mockCollection,
  restoreCollection
} from '../../../../tests/mockCollection'
import { stub, restoreAll } from '../../../../tests/helpers.tests'
import { Session } from '../Session'
import { TestCycle } from '../../testcycle/TestCycle'
import { Feedback } from '../../feedback/Feedback'

const getResults = Session.methods.results.run

describe(Session.methods.results.name, function () {
  before(function () {
    mockCollection(Session)
    mockCollection(TestCycle)
    mockCollection(Feedback)
  })

  after(function () {
    restoreCollection(Session)
    restoreCollection(TestCycle)
    restoreCollection(Feedback)
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
    clearCollection(Feedback)
  })

  it('throws if no session doc is found', function () {
    const env = { userId }
    const arg = { sessionId }
    const thrown = expect(() => getResults.call(env, arg)).to.throw('generateFeedback.error')
    thrown.with.property('reason', 'generateFeedback.sessionNotFound')
    thrown.with.deep.property('details', { userId, sessionId })
  })
  it('throws if no test cycle doc is found', function () {
    const sessionDoc = {
      testCycle: Random.id(),
      completedAt: new Date(),
      progress: 13,
      maxProgress: 1357911
    }
    stub(Session, 'collection', () => ({ findOne: () => sessionDoc }))
    const env = { userId }
    const arg = { sessionId }
    const thrown = expect(() => getResults.call(env, arg)).to.throw('generateFeedback.error')
    thrown.with.property('reason', 'generateFeedback.testCycleNotFound')
    thrown.with.deep.property('details', {
      userId,
      sessionId,
      testCycle: sessionDoc.testCycle,
      completedAt: sessionDoc.completedAt,
      progress: sessionDoc.progress,
      maxProgress: sessionDoc.maxProgress
    })
  })
  it('adds a new Record if the feedback doc is not fromDB', function (done) {
    const sessionDoc = {
      _id: sessionId,
      testCycle: Random.id(),
      completedAt: new Date(),
      progress: 13,
      maxProgress: 1357911
    }
    const testCycleDoc = {
      _id: sessionDoc.testCycle
    }
    const feedbackDoc = { fromDB: false, sessionDoc, testCycleDoc, userId }
    stub(Session, 'collection', () => ({ findOne: () => sessionDoc }))
    stub(TestCycle, 'collection', () => ({ findOne: () => testCycleDoc }))
    stub(Feedback, 'collection', () => ({ findOne: () => feedbackDoc }))

    stub(Meteor, 'defer', (fn) => {
      // this is not best practice but best tadeoff with effort
      expect(fn.name).to.equal('addRecordFromFeedback')
      expect(() => fn()).to.throw('Match error: Missing key \'startedAt\' in field sessionDoc')
      done()
    })

    const env = { userId, debug: console.debug, flagFromDb: false }
    const arg = { sessionId }
    getResults.call(env, arg)
  })
})
