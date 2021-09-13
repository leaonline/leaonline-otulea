/* eslint-env mocha */
import { expect } from 'chai'
import { Random } from 'meteor/random'
import { startSession } from '../api/startSession'
import {
  mockCollection,
  restoreCollection
} from '../../../../tests/mockCollection'
import { stub, restoreAll } from '../../../../tests/helpers.tests'
import { Session } from '../Session'
import { TestCycle } from '../../testcycle/TestCycle'
import { UnitSet } from '../../unitSet/UnitSet'
import { Unit } from '../../Unit'
import { DocNotFoundError } from '../../errors/DocNotFoundError'

describe(startSession.name, function () {
  beforeEach(function () {
    mockCollection(Session)
    mockCollection(TestCycle)
    mockCollection(UnitSet)
    mockCollection(Unit)
  })

  afterEach(function () {
    restoreCollection(Session)
    restoreAll()
  })

  it('throws if a running session already exists for this test', function () {
    const doc = {}
    stub(Session, 'collection', () => ({
      findOne: () => doc
    }))
    const options = {
      testCycleId: Random.id(),
      userId: Random.id()
    }
    expect(() => startSession(options)).to.throw('session.existsAlready')
  })
  it('throws if there is no doc for the given testCycleId', function () {
    stub(Session, 'collection', () => ({ findOne: () => {} }))
    stub(TestCycle, 'collection', () => ({ findOne: () => {} }))
    const options = {
      testCycleId: Random.id(),
      userId: Random.id()
    }
    expect(() => startSession(options)).to.throw(DocNotFoundError.reason)
  })
  it('throws if there is no doc for the linked unitSetId', function () {
    const doc = {}
    stub(TestCycle, 'collection', () => ({ findOne: () => doc }))
    stub(UnitSet, 'collection', () => ({ findOne: () => {} }))
    const options = {
      testCycleId: Random.id(),
      userId: Random.id()
    }
    expect(() => startSession(options)).to.throw(DocNotFoundError.reason)

    doc.unitSets = []
    expect(() => startSession(options)).to.throw(DocNotFoundError.reason)
  })
  it('throws if there is no doc for the linked unitId', function () {
    const usDoc = { _id: Random.id() }
    const tcDoc = {
      unitSets: [usDoc._id]
    }
    stub(TestCycle, 'collection', () => ({ findOne: () => tcDoc }))
    stub(UnitSet, 'collection', () => ({ findOne: () => usDoc }))
    stub(Unit, 'collection', () => ({ findOne: () => {} }))
    const options = {
      testCycleId: Random.id(),
      userId: Random.id()
    }
    expect(() => startSession(options)).to.throw(DocNotFoundError.reason)

    usDoc.units = []
    expect(() => startSession(options)).to.throw(DocNotFoundError.reason)
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
    const options = {
      testCycleId: tcDoc._id,
      userId: Random.id()
    }
    const sessionDoc = startSession(options)

    expect(sessionDoc.startedAt instanceof Date).to.equal(true)
    expect(sessionDoc.testCycle).to.equal(tcDoc._id)
    expect(sessionDoc.unitSet).to.equal(usDoc._id)
    expect(sessionDoc.currentUnit).to.equal(unitDoc._id)
    expect(sessionDoc.progress).to.equal(0)
    expect(sessionDoc.maxProgress).to.equal(tcDoc.progress)
  })
})
