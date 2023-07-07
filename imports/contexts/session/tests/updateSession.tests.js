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
import { DocumentList } from '../../../api/lists/DocumentList'

const updateSession = Session.methods.next.run

describe(Session.methods.next.name, function () {
  before(function () {
    mockCollection(Session)
    mockCollection(TestCycle)
    mockCollection(UnitSet)
    mockCollection(Unit)
  })

  after(function () {
    restoreCollection(Session)
    restoreCollection(TestCycle)
    restoreCollection(UnitSet)
    restoreCollection(Unit)
  })

  let sessionId
  let userId
  let currentUnit

  beforeEach(function () {
    sessionId = Random.id()
    userId = Random.id()
    currentUnit = Random.id()
  })

  afterEach(function () {
    restoreAll()
    clearCollection(Session)
    clearCollection(TestCycle)
    clearCollection(UnitSet)
    clearCollection(Unit)
  })

  it('throws if there is no sessionDoc for sessionId', function () {
    stub(Session, 'collection', () => ({ findOne: () => {} }))

    const env = { userId }
    const arg = { sessionId }
    expect(() => updateSession.call(env, arg)).to.throw(DocNotFoundError.reason)
  })
  it('throws if there is no testCycleDoc for the given testCycle', function () {
    const sessionDoc = {}
    stub(Session, 'collection', () => ({ findOne: () => sessionDoc }))
    stub(TestCycle, 'collection', () => ({ findOne: () => {} }))

    const env = { userId }
    const arg = { sessionId }
    expect(() => updateSession.call(env, arg)).to.throw(DocNotFoundError.reason)
  })
  it('throws if there is no UnitSet doc for the given unitSet id', function () {
    const sessionDoc = {}
    const tcDoc = {}
    stub(Session, 'collection', () => ({ findOne: () => sessionDoc }))
    stub(TestCycle, 'collection', () => ({ findOne: () => tcDoc }))
    stub(UnitSet, 'collection', () => ({ findOne: () => {} }))

    const env = { userId }
    const arg = { sessionId }
    expect(() => updateSession.call(env, arg)).to.throw(DocNotFoundError.reason)
  })
  it('throws if there is no unit doc for the given unit id', function () {
    const sessionDoc = {}
    const tcDoc = {}
    const usDoc = {}
    stub(Session, 'collection', () => ({ findOne: () => sessionDoc }))
    stub(TestCycle, 'collection', () => ({ findOne: () => tcDoc }))
    stub(UnitSet, 'collection', () => ({ findOne: () => usDoc }))
    stub(Unit, 'collection', () => ({ findOne: () => {} }))

    const env = { userId }
    const arg = { sessionId }
    expect(() => updateSession.call(env, arg)).to.throw(DocNotFoundError.reason)
  })
  it('throws if there can be no lists created from the given documents', function () {
    const sessionDoc = {}
    const tcDoc = {}
    const usDoc = {}
    const unitDoc = { pages: [] }
    stub(Session, 'collection', () => ({ findOne: () => sessionDoc }))
    stub(TestCycle, 'collection', () => ({ findOne: () => tcDoc }))
    stub(UnitSet, 'collection', () => ({ findOne: () => usDoc }))
    stub(Unit, 'collection', () => ({ findOne: () => unitDoc }))

    const env = { userId }
    const arg = { sessionId }
    expect(() => updateSession.call(env, arg)).to.throw(DocumentList.noList)
  })
  it('completes unitSet and cycle if this is the very last unit', function () {
    const usDoc = {
      _id: Random.id(),
      units: [currentUnit]
    }
    const tcDoc = {
      _id: Random.id(),
      unitSets: [usDoc._id]
    }
    const sessionDoc = {
      _id: sessionId,
      currentUnit,
      testCycleId: tcDoc._id,
      unitSet: usDoc._id
    }
    const unitDoc = { pages: [{}, {}] }
    stub(Unit, 'collection', () => ({ findOne: () => unitDoc }))
    stub(TestCycle, 'collection', () => ({ findOne: () => tcDoc }))
    stub(UnitSet, 'collection', () => ({ findOne: () => usDoc }))
    stub(Session, 'collection', () => ({
      findOne: () => sessionDoc,
      update: (selector, modifier) => {
        expect(selector).to.equal(sessionId)
        expect(modifier.$set.currentUnit).to.equal(null)
        expect(modifier.$set.updatedAt instanceof Date).to.equal(true)
        expect(modifier.$set.completedAt instanceof Date).to.equal(true)
        expect(modifier.$inc.progress).to.equal(2)
      }
    }))

    const env = { userId }
    const arg = { sessionId }
    const result = updateSession.call(env, arg)
    expect(result).to.deep.equal({
      nextUnit: null,
      nextUnitSet: null,
      hasStory: false,
      completed: true
    })
  })
  it('completes unitSet and iterates to the next if this is the last unit but not last unit set', function () {
    const nextUnitSetId = Random.id()
    const nextUnitId = Random.id()
    const usDoc = {
      _id: Random.id(),
      units: [currentUnit]
    }
    const nextUsDoc = {
      _id: nextUnitSetId,
      units: [nextUnitId],
      story: [{}]
    }
    const tcDoc = {
      _id: Random.id(),
      unitSets: [usDoc._id, nextUnitSetId]
    }
    const sessionDoc = {
      _id: sessionId,
      currentUnit,
      testCycleId: tcDoc._id,
      unitSet: usDoc._id
    }
    const unitDoc = { pages: [{}, {}] }
    stub(Unit, 'collection', () => ({ findOne: () => unitDoc }))
    stub(TestCycle, 'collection', () => ({ findOne: () => tcDoc }))
    stub(UnitSet, 'collection', () => ({
      findOne: (id) => {
        if (id === usDoc._id) return usDoc
        if (id === nextUsDoc._id) return nextUsDoc
      }
    }))
    stub(Session, 'collection', () => ({
      findOne: () => sessionDoc,
      update: (selector, modifier) => {
        expect(selector).to.equal(sessionId)
        expect(modifier.$set.unitSet).to.equal(nextUnitSetId)
        expect(modifier.$set.currentUnit).to.equal(nextUnitId)
        expect(modifier.$set.completedAt instanceof Date).to.equal(false)
        expect(modifier.$inc.progress).to.equal(2)
      }
    }))

    const env = { userId }
    const arg = { sessionId }
    const result = updateSession.call(env, arg)
    expect(result).to.deep.equal({
      nextUnit: nextUnitId,
      nextUnitSet: nextUnitSetId,
      hasStory: true,
      completed: false
    })
  })
  it('iterates to the next unit if this is not the last unit in unitSet', function () {
    const nextUnitId = Random.id()
    const usDoc = {
      _id: Random.id(),
      units: [currentUnit, nextUnitId]
    }
    const tcDoc = {
      _id: Random.id(),
      unitSets: [usDoc._id]
    }
    const sessionDoc = {
      _id: sessionId,
      currentUnit,
      testCycleId: tcDoc._id,
      unitSet: usDoc._id
    }
    const unitDoc = { pages: [{}, {}] }
    stub(Unit, 'collection', () => ({ findOne: () => unitDoc }))
    stub(TestCycle, 'collection', () => ({ findOne: () => tcDoc }))
    stub(UnitSet, 'collection', () => ({ findOne: () => usDoc }))
    stub(Session, 'collection', () => ({
      findOne: () => sessionDoc,
      update: (selector, modifier) => {
        expect(selector).to.equal(sessionId)
        expect(modifier.$set.unitSet).to.equal(undefined)
        expect(modifier.$set.currentUnit).to.equal(nextUnitId)
        expect(modifier.$set.completedAt instanceof Date).to.equal(false)
        expect(modifier.$inc.progress).to.equal(2)
      }
    }))

    const env = { userId }
    const arg = { sessionId }
    const result = updateSession.call(env, arg)
    expect(result).to.deep.equal({
      nextUnit: nextUnitId,
      nextUnitSet: null,
      hasStory: false,
      completed: false
    })
  })
})
