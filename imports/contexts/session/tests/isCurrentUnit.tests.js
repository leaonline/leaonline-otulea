/* eslint-env mocha */
import { expect } from 'chai'
import { Random } from 'meteor/random'
import { isCurrentUnit } from '../utils/isCurrentUnit'

describe(isCurrentUnit.name, function () {
  it('returns, whether the unitId belongs to the session current unit or not', function () {
    expect(isCurrentUnit({
      sessionDoc: {
        currentUnit: Random.id()
      },
      unitId: Random.id()
    })).to.equal(false)

    const unitId = Random.id()
    expect(isCurrentUnit({
      sessionDoc: { currentUnit: unitId }, unitId
    })).to.equal(true)
  })
})
