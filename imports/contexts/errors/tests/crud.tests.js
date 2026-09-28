/* eslint-env mocha */
import { expect } from 'chai'
import { Random } from 'meteor/random'
import { getError } from '../api/getError'
import { getAllErrors } from '../api/getAllErrors'
import { removeError } from '../api/removeError'
import { Errors } from '../Errors'
import {
  clearCollection,
  mockCollection,
  restoreCollection,
} from '../../../../tests/mockCollection'
import { stub, restoreAll, expectThrow } from '../../../../tests/helpers.tests'

describe('crud', () => {
  before(() => {
    mockCollection(Errors)
  })
  after(() => {
    restoreCollection(Errors)
  })

  afterEach(() => {
    restoreAll()
    clearCollection(Errors)
  })

  describe(getError.name, () => {
    it('returns the query result', async () => {
      const doc = { _id: Random.id() }
      stub(Errors, 'collection', () => ({
        findOneAsync: async (query) => {
          expect(query).to.equal(doc._id)
        },
      }))
      await getError(doc._id)
    })
  })
  describe(getAllErrors.name, () => {
    it('returns the query result if not array is passed', async () => {
      stub(Errors, 'collection', () => ({
        find: (query) => {
          expect(query).to.deep.equal({})
          return { fetchAsync: async () => {} }
        },
      }))
      await getAllErrors()
    })
    it('returns the query with filtered ids, by given array', async () => {
      const arr = [Random.id()]
      stub(Errors, 'collection', () => ({
        find: (query) => {
          expect(query).to.deep.equal({
            _id: { $in: arr },
          })
          return { fetchAsync: async () => {} }
        },
      }))
      await getAllErrors(arr)
    })
    it('throws if the ids param is given but not an array', async () => {
      await expectThrow({
        fn: () => getAllErrors(true),
        message: 'errors.getAll.arrayExpected',
      })
    })
  })
  describe(removeError.name, () => {
    it('removes by the query', async () => {
      const doc = { _id: Random.id() }
      stub(Errors, 'collection', () => ({
        removeAsync: async (query) => {
          expect(query).to.equal(doc._id)
        },
      }))
      await removeError(doc._id)
    })
  })
})
