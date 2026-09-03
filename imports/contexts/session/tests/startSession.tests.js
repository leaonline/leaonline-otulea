/* eslint-env mocha */
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
import { UnitSet } from '../../unitSet/UnitSet'
import { Unit } from '../../Unit'
import { DocNotFoundError } from '../../errors/DocNotFoundError'

const startSession = Session.methods.start.run

describe(Session.methods.start.name, () => {
  let userId
  let testCycleId

  before(() => {
    mockCollection(Session)
    mockCollection(TestCycle)
    mockCollection(UnitSet)
    mockCollection(Unit)
    userId = Random.id()
    testCycleId = Random.id()
  })

  after(() => {
    restoreCollection(Session)
    restoreCollection(TestCycle)
    restoreCollection(UnitSet)
    restoreCollection(Unit)
  })

  afterEach(async () => {
    restoreAll()
    await clearCollection(Session)
    await clearCollection(TestCycle)
    await clearCollection(UnitSet)
    await clearCollection(Unit)
  })

  it('throws if a running session already exists for this test', async () => {
    const doc = {}
    stub(Session, 'collection', () => ({
      findOneAsync: async () => doc,
    }))
    const env = { userId }
    const arg = { testCycleId }
    await expectThrow({
      fn: () => startSession.call(env, arg),
      message: 'session.existsAlready',
    })
  })
  it('throws if there is no doc for the given testCycleId', async () => {
    stub(Session, 'collection', () => ({ findOneAsync: async () => {} }))
    stub(TestCycle, 'collection', () => ({ findOneAsync: async () => {} }))
    const env = { userId }
    const arg = { testCycleId }
    await expectThrow({
      fn: () => startSession.call(env, arg),
      message: DocNotFoundError.reason,
    })
  })
  it('throws if there is no doc for the linked unitSetId', async () => {
    const doc = {}
    stub(TestCycle, 'collection', () => ({ findOneAsync: async () => doc }))
    stub(UnitSet, 'collection', () => ({ findOneAsync: async () => {} }))
    const env = { userId }
    const arg = { testCycleId }
    await expectThrow({
      fn: () => startSession.call(env, arg),
      message: DocNotFoundError.reason,
    })

    doc.unitSets = []
    await expectThrow({
      fn: () => startSession.call(env, arg),
      message: DocNotFoundError.reason,
    })
  })
  it('throws if there is no doc for the linked unitId', async () => {
    const usDoc = { _id: Random.id() }
    const tcDoc = {
      unitSets: [usDoc._id],
    }
    stub(TestCycle, 'collection', () => ({ findOneAsync: async () => tcDoc }))
    stub(UnitSet, 'collection', () => ({ findOneAsync: async () => usDoc }))
    stub(Unit, 'collection', () => ({ findOneAsync: async () => {} }))
    const env = { userId }
    const arg = { testCycleId }
    await expectThrow({
      fn: () => startSession.call(env, arg),
      message: DocNotFoundError.reason,
    })

    usDoc.units = []
    await expectThrow({
      fn: () => startSession.call(env, arg),
      message: DocNotFoundError.reason,
    })
  })
  it('creates a new session doc', async () => {
    const unitDoc = { _id: Random.id() }
    const usDoc = { _id: Random.id(), units: [unitDoc._id] }
    const tcDoc = {
      _id: Random.id(),
      unitSets: [usDoc._id],
      progress: Math.random(),
    }
    stub(TestCycle, 'collection', () => ({ findOneAsync: async () => tcDoc }))
    stub(UnitSet, 'collection', () => ({ findOneAsync: async () => usDoc }))
    stub(Unit, 'collection', () => ({ findOneAsync: async () => unitDoc }))

    const env = { userId }
    const arg = { testCycleId: tcDoc._id }
    const sessionDoc = await startSession.call(env, arg)

    expect(sessionDoc.startedAt instanceof Date).to.equal(true)
    expect(sessionDoc.testCycle).to.equal(tcDoc._id)
    expect(sessionDoc.unitSet).to.equal(usDoc._id)
    expect(sessionDoc.currentUnit).to.equal(unitDoc._id)
    expect(sessionDoc.progress).to.equal(0)
    expect(sessionDoc.maxProgress).to.equal(tcDoc.progress)
  })
})
