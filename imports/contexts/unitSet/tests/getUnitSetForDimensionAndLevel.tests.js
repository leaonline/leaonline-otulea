/* eslint-env mocha */
import { expect } from 'chai'
import { Random } from 'meteor/random'
import { getUnitSetForDimensionAndLevel } from '../api/getUnitSetForDimensionAndLevel'
import {
  mockCollection,
  restoreCollection
} from '../../../../tests/mockCollection'
import { stub, restoreAll } from '../../../../tests/helpers.tests'
import { UnitSet } from '../UnitSet'

describe(getUnitSetForDimensionAndLevel.name, function () {
  beforeEach(function () {
    mockCollection(UnitSet)
  })
  afterEach(function () {
    restoreCollection(UnitSet)
    restoreAll()
  })
  it('returns the unit for given dimension and level', function () {
    const doc = {
      dimension: Random.id(),
      level: Random.id()
    }
    stub(UnitSet, 'collection', () => ({
      findOne: query => {
        expect(query).to.deep.equal(doc)
      }
    }))
    getUnitSetForDimensionAndLevel(doc)
  })
})
