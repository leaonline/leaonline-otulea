/* eslint-env mocha */
import { expect } from 'chai'
import { Random } from 'meteor/random'
import { getLastSessionByTestCylce } from '../api/getLastSessionByTestCyclce'
import { mockCollection, restoreCollection } from '../../../../tests/mockCollection'
import { restoreAll, stub } from '../../../../tests/helpers.tests'
import { Session } from '../Session'

describe(getLastSessionByTestCylce.name, function () {
  let testCycleId
  let userId
  beforeEach(function () {
    mockCollection(Session)
    testCycleId = Random.id()
    userId = Random.id()
  })

  afterEach(function () {
    restoreCollection(Session)
    restoreAll()
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
