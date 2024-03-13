/* eslint-env mocha */
import { expect } from 'chai'
import { Random } from 'meteor/random'
import { clearCollection, mockCollection, restoreCollection } from '../../../../tests/mockCollection'
import { restoreAll, stub } from '../../../../tests/helpers.tests'
import { Session } from '../Session'
import { TestCycle } from '../../testcycle/TestCycle'

const recentCompleted = Session.methods.recentCompleted.run

describe(Session.methods.recentCompleted.name, function () {
  let userIds

  before(function () {
    mockCollection(Session)
    mockCollection(TestCycle)
  })

  after(function () {
    restoreCollection(Session)
    restoreCollection(TestCycle)
  })

  beforeEach(function () {
    userIds = [Random.id(), Random.id()]
  })

  afterEach(function () {
    restoreAll()
    clearCollection(Session)
    clearCollection(TestCycle)
  })

  const createSessionDoc = ({
    userId = Random.id(),
    completedAt,
    testCycleId = Random.id(),
    unitId = Random.id(),
    unitSetId = Random.id()
  }) => ({
    userId,
    startedAt: new Date(Date.now() - 60 * 1000 * 120),
    completedAt: completedAt,
    testCycle: testCycleId,
    unit: unitId,
    unitSet: unitSetId
  })

  it('returns the N recent completed sessions for given users', function () {
    // insert a few docs from our target users
    const insert = ({ completedAt }) => userIds.map(userId => {
      const insertId = Session
        .collection()
        .insert(createSessionDoc({
          userId,
          completedAt
        }))
      return Session.collection().findOne(insertId)
    })

    insert({ completedAt: new Date() })
    // add some random docs from other users
    Session.collection().insert(createSessionDoc({}))
    const expected = insert({ completedAt: new Date() })
    insert({})
    Session.collection().insert(createSessionDoc({}))

    const docs = recentCompleted({ users: userIds })
    expect(docs).to.deep.equal(expected)

    const tcDocs = docs.map(doc => ({ _id: doc.testCycle }))

    stub(TestCycle, 'collection', () => ({
      findOne (_id) {
        return tcDocs.find(doc => doc._id === _id)
      }
    }))

    const resolved = recentCompleted({ users: userIds, resolve: true })
    expect(resolved.map(doc => doc.testCycle)).to.deep.equal(tcDocs)
  })
})
