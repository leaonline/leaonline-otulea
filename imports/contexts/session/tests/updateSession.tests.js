/* eslint-env mocha */
import { expect } from 'chai'
import { Random } from 'meteor/random'
import { updateSession } from '../api/updateSession'
import { mockCollection, restoreCollection } from '../../../../tests/mockCollection'
import { stub, restoreAll } from '../../../../tests/helpers.tests'
import { Session } from '../Session'
import { TestCycle } from '../../testcycle/TestCycle'
import { UnitSet } from '../../unitSet/UnitSet'
import { DocNotFoundError } from '../../errors/DocNotFoundError'
import { DocumentList } from '../../../api/lists/DocumentList'

describe(updateSession.name, function () {
  let sessionId
  let userId
  let currentUnit
  beforeEach(function () {
    mockCollection(Session)
    mockCollection(TestCycle)
    mockCollection(UnitSet)
    sessionId = Random.id()
    userId = Random.id()
    currentUnit = Random.id()
  })

  afterEach(function () {
    restoreCollection(Session)
    restoreAll()
  })

  it('throws if there is no sessionDoc for sessionId', function () {
    stub(Session, 'collection', () => ({ findOne: () => {} }))

    const options = { sessionId, userId }
    expect(() => updateSession(options)).to.throw(DocNotFoundError.reason)
  })
  it('throws if there is no testCycleDoc for the given testCycle', function () {
    const sessionDoc = {}
    stub(Session, 'collection', () => ({ findOne: () => sessionDoc }))
    stub(TestCycle, 'collection', () => ({ findOne: () => {} }))

    const options = { sessionId, userId }
    expect(() => updateSession(options)).to.throw(DocNotFoundError.reason)
  })
  it('throws if there is no UnitSet doc for the given unitSet id', function () {
    const sessionDoc = {}
    const tcDoc = {}
    stub(Session, 'collection', () => ({ findOne: () => sessionDoc }))
    stub(TestCycle, 'collection', () => ({ findOne: () => tcDoc }))
    stub(UnitSet, 'collection', () => ({ findOne: () => {} }))

    const options = { sessionId, userId }
    expect(() => updateSession(options)).to.throw(DocNotFoundError.reason)
  })
  it('throws if there can be no lists created from the given documents', function () {
    const sessionDoc = {}
    const tcDoc = {}
    const usDoc = {}
    stub(Session, 'collection', () => ({ findOne: () => sessionDoc }))
    stub(TestCycle, 'collection', () => ({ findOne: () => tcDoc }))
    stub(UnitSet, 'collection', () => ({ findOne: () => usDoc }))

    const options = { sessionId, userId }
    expect(() => updateSession(options)).to.throw(DocumentList.noList)
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
    stub(TestCycle, 'collection', () => ({ findOne: () => tcDoc }))
    stub(UnitSet, 'collection', () => ({ findOne: () => usDoc }))
    stub(Session, 'collection', () => ({
      findOne: () => sessionDoc,
      update: (selector, modifier) => {
        expect(selector).to.equal(sessionId)
        expect(modifier.$set.currentUnit).to.equal(null)
        expect(modifier.$set.updatedAt instanceof Date).to.equal(true)
        expect(modifier.$set.completedAt instanceof Date).to.equal(true)
      }
    }))

    const options = { sessionId, userId }
    const result = updateSession(options)
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
      }
    }))

    const options = { sessionId, userId }
    const result = updateSession(options)
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
    stub(TestCycle, 'collection', () => ({ findOne: () => tcDoc }))
    stub(UnitSet, 'collection', () => ({ findOne: () => usDoc }))
    stub(Session, 'collection', () => ({
      findOne: () => sessionDoc,
      update: (selector, modifier) => {
        expect(selector).to.equal(sessionId)
        expect(modifier.$set.unitSet).to.equal(undefined)
        expect(modifier.$set.currentUnit).to.equal(nextUnitId)
        expect(modifier.$set.completedAt instanceof Date).to.equal(false)
      }
    }))

    const options = { sessionId, userId }
    const result = updateSession(options)
    expect(result).to.deep.equal({
      nextUnit: nextUnitId,
      nextUnitSet: null,
      hasStory: false,
      completed: false
    })
  })
})
