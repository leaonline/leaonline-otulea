/* eslint-env mocha */
import { expect } from 'chai'
import { Random } from 'meteor/random'
import { cancelSession } from '../api/cancelSession'
import { mockCollection, restoreCollection } from '../../../../tests/mockCollection'
import { stub, restoreAll } from '../../../../tests/helpers.tests'
import { Session } from '../Session'
import { Response } from '../../response/Response'
import { DocNotFoundError } from '../../errors/DocNotFoundError'

describe(cancelSession.name, function () {
  let sessionId
  let userId
  let currentUnit
  beforeEach(function () {
    mockCollection(Session)
    mockCollection(Response)
    sessionId = Random.id()
    userId = Random.id()
    currentUnit = Random.id()
  })

  afterEach(function () {
    restoreCollection(Session)
    restoreCollection(Response)
    restoreAll()
  })
  it('throws if there is no sessionDoc by id', function () {
    stub(Session, 'collection', () => ({ findOne: () => {}}))
    const options= { sessionId, userId }
    expect(() => cancelSession(options)).to.throw(DocNotFoundError.reason)
  })
  it('deletes the sessionDoc if its empty', function () {
    const doc = { _id: sessionId }
    stub(Session, 'collection', () => ({
      findOne: () => doc,
      remove: id => {
        expect(id).to.deep.equal(sessionId)
        return 1
      }
    }))
    stub(Response, 'collection', () => ({ find: () => ({ count: () => 0 })}))
    const options= { sessionId, userId }
    const removed = cancelSession(options)
    expect(removed).to.equal(1)
  })
  it('sets the sessionDoc as cancelled if not empty', function () {
    const doc = { _id: sessionId, progress: 1 }
    stub(Session, 'collection', () => ({
      findOne: () => doc,
      update: (id, modifier) => {
        expect(id).to.deep.equal(sessionId)
        expect(modifier.$set.cancelledAt instanceof Date).to.equal(true)
        return 1
      }
    }))
    stub(Response, 'collection', () => ({ find: () => ({ count: () => 1 })}))
    const options= { sessionId, userId }
    const updated = cancelSession(options)
    expect(updated).to.equal(1)
  })
})
