/* eslint-env mocha */
import { expect } from 'chai'
import { Random } from 'meteor/random'
import { getSessionResponses } from '../api/getSessionResponses'
import {
  clearCollection,
  mockCollection,
  restoreCollection,
} from '../../../../tests/mockCollection'
import { stub, restoreAll } from '../../../../tests/helpers.tests'
import { Response } from '../../response/Response'

describe(getSessionResponses.name, () => {
  before(() => {
    mockCollection(Response)
  })

  after(() => {
    restoreCollection(Response)
  })

  let sessionId
  let userId

  beforeEach(() => {
    sessionId = Random.id()
    userId = Random.id()
  })

  afterEach(() => {
    restoreAll()
    clearCollection(Response)
  })

  it('returns all responses to a session, mapped to their scores-entries', async () => {
    const docs = [
      { scores: Random.id() },
      { scores: Random.id() },
      { scores: Random.id() },
      { scores: Random.id() },
    ]

    const expected = docs.map((doc) => doc.scores)

    stub(Response, 'collection', () => ({
      find(query) {
        expect(query).to.deep.equal({ sessionId, userId })
        return { fetchAsync: async () => docs }
      },
    }))

    expect(await getSessionResponses({ sessionId, userId })).to.deep.equal(
      expected,
    )
  })
})
