/* eslint-env mocha */
import { Random } from 'meteor/random'
import { expect } from 'chai'
import { getThresholds } from '../api/getThresholds'
import { Thresholds } from '../Thresholds'
import { clearCollection, mockCollection, restoreCollection } from '../../../../tests/mockCollection'

describe(getThresholds.name, async () => {
  before(() => {
    mockCollection(Thresholds, { attachSchema: false })
  })
  afterEach(async () => {
    await clearCollection(Thresholds)
  })
  after(() => {
    restoreCollection(Thresholds)
  })
  it('calls the external server for all thresholds', async () => {
    const expected = { _id: Random.id(), foo: Math.random().toString(10) }
    await Thresholds.collection().insertAsync(expected)

    const actual = await getThresholds()
    expect(actual).to.deep.equal(expected)
  })
})
