/* eslint-env mocha */
import { Email } from 'meteor/email'
import { expect } from 'chai'
import { Random } from 'meteor/random'
import { persistError } from '../api/persistError'
import {
  clearCollection,
  mockCollection,
  restoreCollection
} from '../../../../tests/mockCollection'
import { Errors } from '../Errors'
import { restoreAll, stub } from '../../../../tests/helpers.tests'

describe(persistError.name, function () {
  before(function () {
    mockCollection(Errors)
  })
  after(function () {
    restoreCollection(Errors)
  })
  beforeEach(function () {
    stub(Email, 'send', () => {})
  })
  afterEach(function () {
    restoreAll()
    clearCollection(Errors)
  })
  it('saves the error to the collection', function (done) {
    const insertDoc = { hash: Random.id() }
    stub(Errors, 'collection', () => ({
      findOne: () => {},
      update: () => done(new Error('unexpected')),
      insert: doc => {
        expect(doc).to.deep.equal(insertDoc)
        done()
      }
    }))
    persistError(insertDoc)
  })
  it('counts up if the error exists by hash', function (done) {
    const updateDoc = { _id: Random.id(), hash: Random.id() }
    stub(Errors, 'collection', () => ({
      findOne: () => updateDoc,
      update: (id, transform) => {
        expect(id).to.equal(updateDoc._id)
        expect(transform).to.deep.equal({
          $inc: { count: 1 }
        })
        done()
      },
      insert: () => done(new Error('unexpected'))
    }))
    persistError(updateDoc)
  })
})
