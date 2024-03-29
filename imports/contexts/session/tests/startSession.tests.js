/* eslint-env mocha */
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
import { UnitSet } from '../../unitSet/UnitSet'
import { Unit } from '../../Unit'
import { DocNotFoundError } from '../../errors/DocNotFoundError'

const startSession = Session.methods.start.run

describe(Session.methods.start.name, function () {
  let userId
  let testCycleId

  before(function () {
    mockCollection(Session)
    mockCollection(TestCycle)
    mockCollection(UnitSet)
    mockCollection(Unit)
    userId = Random.id()
    testCycleId = Random.id()
  })

  after(function () {
    restoreCollection(Session)
    restoreCollection(TestCycle)
    restoreCollection(UnitSet)
    restoreCollection(Unit)
  })

  afterEach(function () {
    restoreAll()
    clearCollection(Session)
    clearCollection(TestCycle)
    clearCollection(UnitSet)
    clearCollection(Unit)
  })

  it('throws if a running session already exists for this test', function () {
    const doc = {}
    stub(Session, 'collection', () => ({
      findOne: () => doc
    }))
    const env = { userId }
    const arg = { testCycleId }
    expect(() => startSession.call(env, arg)).to.throw('session.existsAlready')
  })
  it('throws if there is no doc for the given testCycleId', function () {
    stub(Session, 'collection', () => ({ findOne: () => {} }))
    stub(TestCycle, 'collection', () => ({ findOne: () => {} }))
    const env = { userId }
    const arg = { testCycleId }
    expect(() => startSession.call(env, arg)).to.throw(DocNotFoundError.reason)
  })
  it('throws if there is no doc for the linked unitSetId', function () {
    const doc = {}
    stub(TestCycle, 'collection', () => ({ findOne: () => doc }))
    stub(UnitSet, 'collection', () => ({ findOne: () => {} }))
    const env = { userId }
    const arg = { testCycleId }
    expect(() => startSession.call(env, arg)).to.throw(DocNotFoundError.reason)

    doc.unitSets = []
    expect(() => startSession.call(env, arg)).to.throw(DocNotFoundError.reason)
  })
  it('throws if there is no doc for the linked unitId', function () {
    const usDoc = { _id: Random.id() }
    const tcDoc = {
      unitSets: [usDoc._id]
    }
    stub(TestCycle, 'collection', () => ({ findOne: () => tcDoc }))
    stub(UnitSet, 'collection', () => ({ findOne: () => usDoc }))
    stub(Unit, 'collection', () => ({ findOne: () => {} }))
    const env = { userId }
    const arg = { testCycleId }
    expect(() => startSession.call(env, arg)).to.throw(DocNotFoundError.reason)

    usDoc.units = []
    expect(() => startSession.call(env, arg)).to.throw(DocNotFoundError.reason)
  })
  it('creates a new session doc', function () {
    const unitDoc = { _id: Random.id() }
    const usDoc = { _id: Random.id(), units: [unitDoc._id] }
    const tcDoc = {
      _id: Random.id(),
      unitSets: [usDoc._id],
      progress: Math.random()
    }
    stub(TestCycle, 'collection', () => ({ findOne: () => tcDoc }))
    stub(UnitSet, 'collection', () => ({ findOne: () => usDoc }))
    stub(Unit, 'collection', () => ({ findOne: () => unitDoc }))

    const env = { userId }
    const arg = { testCycleId: tcDoc._id }
    const sessionDoc = startSession.call(env, arg)

    expect(sessionDoc.startedAt instanceof Date).to.equal(true)
    expect(sessionDoc.testCycle).to.equal(tcDoc._id)
    expect(sessionDoc.unitSet).to.equal(usDoc._id)
    expect(sessionDoc.currentUnit).to.equal(unitDoc._id)
    expect(sessionDoc.progress).to.equal(0)
    expect(sessionDoc.maxProgress).to.equal(tcDoc.progress)
  })
})
