/* eslint-env mocha */
import { expect } from 'chai'
import { Random } from 'meteor/random'
import { getGradeForCompetency } from '../api/getGradeForCompetency'

describe(getGradeForCompetency.name, function () {
  it('throws on incomplete or invalid parameters', function () {
    // missing keys
    [
      {},
      { count: 1 },
      { count: 1, minCount: 1 },
      { count: 1, minCount: 1, correct: 1 },
      { count: 1, minCount: 1, correct: 1 },
      { count: 1, minCount: 1, correct: 1, thresholds: [{}] },
      {
        count: 1,
        minCount: 1,
        correct: 1,
        thresholds: [{ name: Random.id() }]
      },
      {
        count: 1,
        minCount: 1,
        correct: 1,
        thresholds: [{ max: Math.random() }]
      }
    ].forEach(input => {
      expect(() => getGradeForCompetency(input)).to.throw('is required')
    })

    // invalid values: too low
    ;[
      {
        count: -1,
        minCount: 1,
        correct: 1,
        thresholds: [{ max: Math.random(), name: Random.id() }]
      },
      {
        count: 1,
        minCount: -1,
        correct: 1,
        thresholds: [{ max: Math.random(), name: Random.id() }]
      },
      {
        count: 1,
        minCount: 1,
        correct: -1,
        thresholds: [{ max: Math.random(), name: Random.id() }]
      },
      {
        count: 1,
        minCount: 1,
        correct: 1,
        thresholds: [{ max: -1, name: Random.id() }]
      }
    ].forEach(input => {
      expect(() => getGradeForCompetency(input)).to.throw(' must be at least')
    })

    // invalid values: too high
    ;[
      {
        count: 1,
        minCount: 1,
        correct: 1,
        thresholds: [{ max: 2, name: Random.id() }]
      }
    ].forEach(input => {
      expect(() => getGradeForCompetency(input)).to.throw('Max cannot exceed 1')
    })
  })
  it('returns a default if the minimum amount is not reached', function () {
    const actual = getGradeForCompetency({
      count: 1,
      minCount: 2,
      correct: 0,
      thresholds: [{ max: 1, name: Random.id() }]
    })
    expect(actual).to.deep.equal({ name: 'notEnough', index: -1 })
  })
  it('throws in case the perc value is not found in thresholds', function () {
    const call = () => getGradeForCompetency({
      count: 2,
      minCount: 2,
      correct: 0,
      thresholds: [{ max: 1, name: Random.id() }]
    })
    expect(call).to.throw('Unexpected code reach: expected 0 to be within defined thresholds.')
  })
  it('returns the respective threshold entry', function () {
    const thresholds = [
      { max: 1.00, name: Random.id() },
      { max: 0.75, name: Random.id() },
      { max: 0.50, name: Random.id() },
      { max: 0.25, name: Random.id() },
      { max: 0.00, name: Random.id() }
    ]

    // percent exact equal to max
    ;[
      { count: 4, minCount: 4, correct: 4 },
      { count: 4, minCount: 4, correct: 3 },
      { count: 4, minCount: 4, correct: 2 },
      { count: 4, minCount: 4, correct: 1 },
      { count: 4, minCount: 4, correct: 0 }
    ].forEach((params, index) => {
      params.thresholds = thresholds
      const actual = getGradeForCompetency(params)
      expect(actual).to.deep.equal({
        name: thresholds[index].name,
        index: index
      })
    })

    // percent nearly equal to max
    ;[
      { count: 5, minCount: 5, correct: 5 },
      { count: 5, minCount: 5, correct: 4 },
      { count: 5, minCount: 5, correct: 3 },
      { count: 5, minCount: 5, correct: 2 },
      { count: 5, minCount: 5, correct: 1 }
    ].forEach((params, index) => {
      params.thresholds = thresholds
      const actual = getGradeForCompetency(params)
      expect(actual).to.deep.equal({
        name: thresholds[index].name,
        index: index
      })
    })
  })
})
