/* eslint-env mocha */
import { expect } from 'chai'
import { Random } from 'meteor/random'
import { getSessionResponses } from '../api/getSessionResponses'
import {
  mockCollection,
  restoreCollection
} from '../../../../tests/mockCollection'
import { stub, restoreAll } from '../../../../tests/helpers.tests'
import { Response } from '../../response/Response'

describe(getSessionResponses.name, function () {
  let sessionId
  let userId

  beforeEach(function () {
    mockCollection(Response)
    sessionId = Random.id()
    userId = Random.id()
  })

  afterEach(function () {
    restoreCollection(Response)
    restoreAll()
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
      find(query) {
        expect(query).to.deep.equal({ sessionId, userId })
        return docs
      }
    }))

    expect(getSessionResponses({ sessionId, userId })).to.deep.equal(expected)
  })
})
