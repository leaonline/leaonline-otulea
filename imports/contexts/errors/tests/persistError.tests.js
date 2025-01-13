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
  after(async function () {
    restoreCollection(Errors)
  })
  beforeEach(function () {
    stub(Email, 'send', () => {})
  })
  afterEach(async function () {
    restoreAll()
    await clearCollection(Errors)
  })
  it('saves the error to the collection', async function () {
    const insertDoc = { hash: Random.id() }
    let inserted = false
    stub(Errors, 'collection', () => ({
      findOneAsync: () => {},
      updateAsync: expect.fail,
      insertAsync: doc => {
        expect(doc).to.deep.equal(insertDoc)
        inserted = true
      }
    }))
    await persistError(insertDoc)
    expect(inserted).to.equal(true)
  })
  it('counts up if the error exists by hash', async function () {
    const updateDoc = { _id: Random.id(), hash: Random.id() }
    let updated = false
    stub(Errors, 'collection', () => ({
      findOneAsync: () => updateDoc,
      updateAsync: (id, transform) => {
        expect(id).to.equal(updateDoc._id)
        expect(transform).to.deep.equal({
          $inc: { count: 1 }
        })
        updated = true
      },
      insertAsync: expect.fail
    }))
    await persistError(updateDoc)
    expect(updated).to.equal(true)
  })
})
