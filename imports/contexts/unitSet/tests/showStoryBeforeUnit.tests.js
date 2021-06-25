/* eslint-env mocha */
import { expect } from 'chai'
import { Random } from 'meteor/random'
import { showStoryBeforeUnit } from '../api/showStoryBeforeUnit'

describe(showStoryBeforeUnit.name, function () {
  it('throws if unitSet doc is invlaid', function () {
    [undefined, null, {}, { units: [] }].forEach(unitSetDoc => {
      expect(() => showStoryBeforeUnit(Random.id(), unitSetDoc))
        .to.throw('Expected valid unitSet doc, got none or invalid doc')
    })
  })
  it('returns false if the unit has no story', function () {
    expect(showStoryBeforeUnit(Random.id(), {
      units: [Random.id()],
      story: []
    })).to.equal(false)
  })
  it('returns false if the unit is not the first', function () {
    const unitId = Random.id()
    expect(showStoryBeforeUnit(unitId, {
      units: [Random.id(), unitId],
      story: [{}]
    })).to.equal(false)
  })
  it('returns true if the unit has story and is the first', function () {
    const unitId = Random.id()
    expect(showStoryBeforeUnit(unitId, {
      units: [unitId],
      story: [{}]
    })).to.equal(true)
  })
})
