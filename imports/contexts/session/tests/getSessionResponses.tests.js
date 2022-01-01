/* eslint-env mocha */
import { expect } from 'chai'
import { Random } from 'meteor/random'
import { getSessionResponses } from '../api/getSessionResponses'
import {
  clearCollection,
  mockCollection,
  restoreCollection
} from '../../../../tests/mockCollection'
import { stub, restoreAll } from '../../../../tests/helpers.tests'
import { Response } from '../../response/Response'

describe(getSessionResponses.name, function () {
  before(function () {
    mockCollection(Response)
  })

  after(function () {
    restoreCollection(Response)
  })

  let sessionId
  let userId

  beforeEach(function () {

    sessionId = Random.id()
    userId = Random.id()
  })

  afterEach(function () {
    restoreAll()
    clearCollection(Response)
  })

  it('returns all responses to a session, mapped to their scores-entries', function () {
    const docs = [
      { scores: Random.id() },
      { scores: Random.id() },
      { scores: Random.id() },
      { scores: Random.id() }
    ]

    const expected = Object.values(docs).map(doc => doc.scores)

    stub(Response, 'collection', () => ({
      find (query) {
        expect(query).to.deep.equal({ sessionId, userId })
        return docs
      }
    }))

    expect(getSessionResponses({ sessionId, userId })).to.deep.equal(expected)
  })
})
