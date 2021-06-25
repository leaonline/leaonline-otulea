/* eslint-env mocha */
import { expect } from 'chai'
import { Random } from 'meteor/random'
import { getError } from '../api/getError'
import { getAllErrors } from '../api/getAllErrors'
import { removeError } from '../api/removeError'
import { Errors } from '../Errors'
import {
  mockCollection,
  restoreCollection
} from '../../../../tests/mockCollection'
import { stub, restoreAll } from '../../../../tests/helpers.tests'

describe('crud', function () {
  beforeEach(function () {
    mockCollection(Errors)
  })
  afterEach(function () {
    restoreCollection(Errors)
    restoreAll()
  })

  describe(getError.name, function () {
    it('returns the query result', function () {
      const doc = { _id: Random.id() }
      stub(Errors, 'collection', () => ({
        findOne: query => {
          expect(query).to.equal(doc._id)
        }
      }))
      getError(doc._id)
    })
  })
  describe(getAllErrors.name, function () {
    it('returns the query result if not array is passed', function () {
      stub(Errors, 'collection', () => ({
        find: query => {
          expect(query).to.deep.equal({})
          return { fetch: () => {} }
        }
      }))
      getAllErrors()
    })
    it('returns the query with filtered ids, by given array', function () {
      const arr = [Random.id()]
      stub(Errors, 'collection', () => ({
        find: query => {
          expect(query).to.deep.equal({
            _id: { $in: arr }
          })
          return { fetch: () => {} }
        }
      }))
      getAllErrors(arr)
    })
    it('throws if the ids param is given but not an array', function () {
      expect(() => getAllErrors(true)).to.throw('errors.getAll.arrayExpected')
    })
  })
  describe(removeError.name, function () {
    it('removes by the query', function () {
      const doc = { _id: Random.id() }
      stub(Errors, 'collection', () => ({
        remove: query => {
          expect(query).to.equal(doc._id)
        }
      }))
      removeError(doc._id)
    })
  })
})
