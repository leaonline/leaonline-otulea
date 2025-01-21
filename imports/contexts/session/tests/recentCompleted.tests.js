/* eslint-env mocha */
import { expect } from 'chai'
import { Random } from 'meteor/random'
import { clearCollection, mockCollection, restoreCollection } from '../../../../tests/mockCollection'
import { restoreAll, stub } from '../../../../tests/helpers.tests'
import { Session } from '../Session'
import { TestCycle } from '../../testcycle/TestCycle'
import { mapAsync } from '../../../utils/array/mapAsync'

const recentCompleted = Session.methods.recentCompleted.run

describe(Session.methods.recentCompleted.name, async () => {
  let userIds

  before(async () => {
    mockCollection(Session)
    mockCollection(TestCycle)
  })

  after(async () => {
    restoreCollection(Session)
    restoreCollection(TestCycle)
  })

  beforeEach(async () => {
    userIds = [Random.id(), Random.id()]
  })

  afterEach(async () => {
    restoreAll()
    await clearCollection(Session)
    await clearCollection(TestCycle)
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

  it('returns the N recent completed sessions for given users', async () => {
    // insert a few docs from our target users
    const insert = async ({ completedAt }) => mapAsync(userIds, async (userId) => {
      const insertId = await Session
        .collection()
        .insertAsync(createSessionDoc({ userId, completedAt }))
        return await Session.collection().findOneAsync(insertId)
    })

    await insert({ completedAt: new Date() })
    // add some random docs from other users
    await Session.collection().insertAsync(createSessionDoc({}))
    const expected = await insert({ completedAt: new Date() })
    await insert({})
    await Session.collection().insertAsync(createSessionDoc({}))

    const docs = await recentCompleted({ users: userIds })
    expect(docs).to.deep.equal(expected)

    const tcDocs = docs.map(doc => ({ _id: doc.testCycle }))

    stub(TestCycle, 'collection', () => ({
      findOneAsync: async (_id) => {
        return tcDocs.find(doc => doc._id === _id)
      }
    }))

    const resolved = await recentCompleted({ users: userIds, resolve: true })
    expect(resolved.map(doc => doc.testCycle)).to.deep.equal(tcDocs)
  })
})
