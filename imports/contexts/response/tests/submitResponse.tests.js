/* eslint-env mocha */
import { expect } from 'chai'
import { Random } from 'meteor/random'
import { createSubmitResponse } from '../api/createSubmitResponse'
import {
  clearCollection,
  mockCollection,
  restoreCollection
} from '../../../../tests/mockCollection'
import { Unit } from '../../Unit'
import { Session } from '../../session/Session'
import { Response } from '../Response'
import { expectThrow, restoreAll, stub } from '../../../../tests/helpers.tests'
import { asyncTimeout } from '../../../utils/asyncTimeout'

describe(createSubmitResponse.name, function () {
  before(function () {
    mockCollection(Unit)
    mockCollection(Session)
    mockCollection(Response)
  })
  after(function () {
    restoreCollection(Unit)
    restoreCollection(Session)
    restoreCollection(Response)
  })
  afterEach(async () => {
    restoreAll()
    await clearCollection(Unit)
    await clearCollection(Session)
    await clearCollection(Response)
  })
  it('throws if the session and unit do not match', async function () {
    const submitResponse = createSubmitResponse({})
    const input = [
      undefined,
      {},
      { responseDoc: {} },
      {
        responseDoc: {
          sessionId: Random.id(),
          unitId: Random.id()
        }
      }
    ];

    for (const entry of input) {
      await expectThrow({
        fn: () => submitResponse(input),
        message: 'response.isNotCurrentUnit'
      })
    }
  })
  it('submits a scored response', async () => {
    stub(Session, 'collection', () => ({
      findOneAsync: async () => sessionDoc
    }))
    stub(Unit, 'collection', () => ({
      findOneAsync: async () => unitDoc
    }))

    const userId = Random.id()
    const itemDoc = {}
    const unitDoc = { _id: Random.id() }
    const sessionDoc = {
      _id: Random.id(),
      currentUnit: unitDoc._id
    }
    const responseDoc = {
      sessionId: sessionDoc._id,
      unitId: unitDoc._id,
      contentId: Random.id(),
      responses: [Random.id()],
      page: Math.floor(Math.random() * 10000)
    }

    const scores = [Random.id()]

    const submitResponse = createSubmitResponse({
      extractor: () => itemDoc,
      scorer: () => scores
    })

    let upsertComplete = false
    stub(Response, 'collection', () => ({
      upsertAsync: async (query, modifier) => {
        expect(query).to.deep.equal({
          userId: userId,
          sessionId: sessionDoc._id,
          unitId: unitDoc._id,
          contentId: responseDoc.contentId
        })

        expect(modifier).to.deep.equal({
          $set: {
            userId: userId,
            sessionId: sessionDoc._id,
            unitId: unitDoc._id,
            contentId: responseDoc.contentId,
            responses: responseDoc.responses,
            page: responseDoc.page,
            scores: scores,
            failed: undefined
          }
        })
        upsertComplete = true
      }
    }))

    await submitResponse({ responseDoc, userId })
    expect(upsertComplete).to.equal(true)
  })
  it('submits a response with failed score', async () => {
    stub(Session, 'collection', () => ({
      findOneAsync: async () => sessionDoc
    }))
    stub(Unit, 'collection', () => ({
      findOneAsync: async () => unitDoc
    }))

    const userId = Random.id()
    const itemDoc = {}
    const unitDoc = {
      _id: Random.id()
    }
    const sessionDoc = {
      _id: Random.id(),
      currentUnit: unitDoc._id
    }
    const responseDoc = {
      sessionId: sessionDoc._id,
      unitId: unitDoc._id,
      contentId: Random.id(),
      responses: [Random.id()],
      page: Math.floor(Math.random() * 10000)
    }

    const errorId = Random.id()
    let err1Called = false
    let err2Called = false
    let ups1Called = 0
    stub(Response, 'collection', () => ({
      upsertAsync: async (query, modifier) => {
        expect(query).to.deep.equal({
          userId: userId,
          sessionId: sessionDoc._id,
          unitId: unitDoc._id,
          contentId: responseDoc.contentId
        })

        expect(modifier).to.deep.equal({
          $set: {
            userId: userId,
            sessionId: sessionDoc._id,
            unitId: unitDoc._id,
            contentId: responseDoc.contentId,
            responses: responseDoc.responses,
            page: responseDoc.page,
            scores: [],
            failed: true
          }
        })

        ups1Called++
      }
    }))

    // fail at extractor
    await createSubmitResponse({
      extractor: () => {
        throw new Error(errorId)
      },
      scorer: () => []
    })({
      responseDoc,
      userId,
      onError: e => {
        expect(e.message).to.equal(errorId)
        err1Called = true
      }
    })

    // fail at scorer
    await createSubmitResponse({
      extractor: () => itemDoc,
      scorer: () => {
        throw new Error(errorId)
      }
    })({
      responseDoc,
      userId,
      onError: e => {
        expect(e.message).to.equal(errorId)
        err2Called = true
      }
    })

    await asyncTimeout(10)

    // ensure branches were covered
    expect(err1Called).to.equal(true)
    expect(err2Called).to.equal(true)
    expect(ups1Called).to.equal(2)
  })
})
