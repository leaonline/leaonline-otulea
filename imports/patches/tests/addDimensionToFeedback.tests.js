/* eslint-env mocha */
import { Random } from 'meteor/random'
import { expect } from 'chai'
import { addDimensionToFeedback } from '../addDimensionToFeedback'
import { mockCollection, restoreCollection } from '../../../tests/mockCollection'
import { Feedback } from '../../contexts/feedback/Feedback'
import { TestCycle } from '../../contexts/testcycle/TestCycle'
import { randomHex } from '../../../tests/random'

describe(addDimensionToFeedback.name, function () {
  before(function () {
    mockCollection(Feedback, { attachSchema: false })
    mockCollection(TestCycle, { attachSchema: false })
  })

  beforeEach(function () {
    Feedback.collection().remove({})
  })

  after(function () {
    restoreCollection(Feedback)
    restoreCollection(TestCycle)
  })

  it('runs through all feedback docs that have no dimension entry yet', function () {
    const testCycle = TestCycle.collection().insert({
      dimension: randomHex()
    })
    Feedback.collection().insert({ testCycle, dimension: randomHex() })
    Feedback.collection().insert({ testCycle })

    const result = addDimensionToFeedback({ dryRun: false })
    expect(result).to.deep.equal({
      found: 1,
      missing: [],
      updated: 1
    })
  })
  it('adds missing testCycles to the result and skips these docs', function () {
    const testCycle = Random.id()
    const feedbackId = Feedback.collection().insert({ testCycle })
    const result = addDimensionToFeedback({ dryRun: false })
    expect(result).to.deep.equal({
      found: 1,
      missing: [{ testCycle }],
      updated: 0
    })

    expect(Feedback.collection().findOne(feedbackId).dimension).to.equal(undefined)
  })
  it('updates the dimension from the testCycle to the feedback doc', function () {
    const dimensionId1 = Random.id()
    const dimensionId2 = Random.id()

    const testCycle = TestCycle.collection().insert({ dimension: dimensionId2 })
    const feedbackId1 = Feedback.collection().insert({ testCycle, dimension: dimensionId1 })
    const feedbackId2 = Feedback.collection().insert({ testCycle })

    const result = addDimensionToFeedback({ dryRun: false })
    expect(result).to.deep.equal({
      found: 1,
      missing: [],
      updated: 1
    })

    // make sure existing dimensions are untouched
    expect(Feedback.collection().findOne(feedbackId1).dimension).to.equal(dimensionId1)

    // make sure dimensions are assigned
    expect(Feedback.collection().findOne(feedbackId2).dimension).to.equal(dimensionId2)
  })
  it('does no db writes if dry-run is active', function () {
    const dimensionId1 = Random.id()
    const dimensionId2 = Random.id()

    const testCycle = TestCycle.collection().insert({ dimension: dimensionId2 })
    const feedbackId1 = Feedback.collection().insert({ testCycle, dimension: dimensionId1 })
    const feedbackId2 = Feedback.collection().insert({ testCycle })

    const result = addDimensionToFeedback({ dryRun: true })
    expect(result).to.deep.equal({
      found: 1,
      missing: [],
      updated: 0
    })

    // make sure existing dimensions are untouched
    expect(Feedback.collection().findOne(feedbackId1).dimension).to.equal(dimensionId1)

    // make sure dimensions are assigned
    expect(Feedback.collection().findOne(feedbackId2).dimension).to.equal(undefined)
  })
})
