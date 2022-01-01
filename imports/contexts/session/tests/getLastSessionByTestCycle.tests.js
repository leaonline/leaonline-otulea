/* eslint-env mocha */
import { expect } from 'chai'
import { Random } from 'meteor/random'
import { getLastSessionByTestCylce } from '../api/getLastSessionByTestCyclce'
import { mockCollection, restoreCollection } from '../../../../tests/mockCollection'
import { restoreAll, stub } from '../../../../tests/helpers.tests'
import { Session } from '../Session'

describe(getLastSessionByTestCylce.name, function () {
  before(function () {
    mockCollection(Session)
  })

  after(function () {
    restoreCollection(Session)
  })

  let testCycleId
  let userId

  beforeEach(function () {
    testCycleId = Random.id()
    userId = Random.id()
  })

  afterEach(function () {
    restoreAll()
    Session.collection().remove({})
  })

  it('returns a doc if the query matches', function (done) {
    stub(Session, 'collection', () => ({
      findOne (query) {
        expect(query).to.deep.equal({
          userId: userId,
          testCycle: testCycleId,
          startedAt: { $exists: true },
          cancelledAt: { $exists: false }
        })
        done()
      }
    }))
    getLastSessionByTestCylce({ testCycleId, userId })
  })
})
