/* eslint-env mocha */
import { expect } from 'chai'
import { Random } from 'meteor/random'
import { getGrade } from '../api/getGrade'

describe(getGrade.name, function () {
  it('throws on incomplete or invalid parameters', function () {
    // missing keys
    [
      {},
      { count: 1 },
      { count: 1, minCount: 1 },
      { count: 1, minCount: 1, percent: 1 },
      { count: 1, minCount: 1, percent: 1 },
      { count: 1, minCount: 1, percent: 1, thresholds: [{}] },
      {
        count: 1,
        minCount: 1,
        percent: 1,
        thresholds: [{ name: Random.id() }]
      },
      {
        count: 1,
        minCount: 1,
        percent: 1,
        thresholds: [{ max: Math.random() }]
      }
    ].forEach(input => {
      expect(() => getGrade(input)).to.throw('is required')
    })

    // invalid values: too low
    ;[
      {
        count: -1,
        minCount: 1,
        percent: 1,
        thresholds: [{ max: Math.random(), name: Random.id() }]
      },
      {
        count: 1,
        minCount: -1,
        percent: 1,
        thresholds: [{ max: Math.random(), name: Random.id() }]
      },
      {
        count: 1,
        minCount: 1,
        percent: -1,
        thresholds: [{ max: Math.random(), name: Random.id() }]
      },
      {
        count: 1,
        minCount: 1,
        percent: 1,
        thresholds: [{ max: -1, name: Random.id() }]
      }
    ].forEach(input => {
      expect(() => getGrade(input)).to.throw(' must be at least')
    })

    // invalid values: too high
    ;[
      {
        count: 1,
        minCount: 1,
        percent: 1,
        thresholds: [{ max: 2, name: Random.id() }]
      }
    ].forEach(input => {
      expect(() => getGrade(input)).to.throw('Max cannot exceed 1')
    })
  })
  it('returns an indicator, if the minimum amount is not reached', function () {
    const name = Random.id()
    const actual = getGrade({
      count: 1,
      minCount: 2,
      percent: 0,
      thresholds: [{ max: 1, name: Random.id() }, { max: 0, name }]
    })
    expect(actual).to.deep.equal({ name, index: 1, notEnough: true })
  })
  it('throws in case the perc value is not found in thresholds', function () {
    const call = () => getGrade({
      count: 2,
      minCount: 2,
      percent: 0,
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
      { count: 4, minCount: 4, percent: 4 / 4, notEnough: false },
      { count: 4, minCount: 4, percent: 3 / 4, notEnough: false },
      { count: 4, minCount: 4, percent: 2 / 4, notEnough: false },
      { count: 4, minCount: 4, percent: 1 / 4, notEnough: false },
      { count: 4, minCount: 4, percent: 0, notEnough: false }
    ].forEach((params, index) => {
      params.thresholds = thresholds
      const actual = getGrade(params)
      expect(actual).to.deep.equal({
        name: thresholds[index].name,
        index: index,
        notEnough: false
      })
    })

    // percent nearly equal to max
    ;[
      { count: 5, minCount: 5, percent: 5 / 5, notEnough: false },
      { count: 5, minCount: 5, percent: 4 / 5, notEnough: false },
      { count: 5, minCount: 5, percent: 3 / 5, notEnough: false },
      { count: 5, minCount: 5, percent: 2 / 5, notEnough: false },
      { count: 5, minCount: 5, percent: 1 / 5, notEnough: false }
    ].forEach((params, index) => {
      params.thresholds = thresholds
      const actual = getGrade(params)
      expect(actual).to.deep.equal({
        name: thresholds[index].name,
        index: index,
        notEnough: false
      })
    })
  })
})
