/* eslint-env mocha */
import { expect } from 'chai'
import { Random } from 'meteor/random'
import { createSubmitResponse } from '../api/createSubmitResponse'
import {
  mockCollection,
  restoreCollection
} from '../../../../tests/mockCollection'
import { Unit } from '../../Unit'
import { Session } from '../../session/Session'
import { Response } from '../Response'
import { restoreAll, stub } from '../../../../tests/helpers.tests'

describe(createSubmitResponse.name, function () {
  beforeEach(function () {
    mockCollection(Unit)
    mockCollection(Session)
    mockCollection(Response)
  })
  afterEach(function () {
    restoreCollection(Unit)
    restoreCollection(Session)
    restoreCollection(Response)
    restoreAll()
  })
  it('throws if the session and unit do not match', function () {
    const submitResponse = createSubmitResponse({})

    ;[
      undefined,
      {},
      { responseDoc: {} },
      {
        responseDoc: {
          sessionId: Random.id(),
          unitId: Random.id()
        }
      },
    ].forEach(input => {
      expect(() => submitResponse(input))
        .to.throw('response.isNotCurrentUnit')
    })
  })
  it('submits a scored response', function (done) {
    stub(Session, 'collection', () => ({
      findOne: () => sessionDoc
    }))
    stub(Unit, 'collection', () => ({
      findOne: () => unitDoc
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

    const scores = [Random.id()]

    const submitResponse = createSubmitResponse({
      extractor: () => itemDoc,
      scorer: () => scores
    })

    stub(Response, 'collection', () => ({
      upsert: (query, modifier) => {
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

        done()
      }
    }))

    submitResponse({ responseDoc, userId })
  })
  it('submits a response with failed score', function () {
    stub(Session, 'collection', () => ({
      findOne: () => sessionDoc
    }))
    stub(Unit, 'collection', () => ({
      findOne: () => unitDoc
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
      upsert: (query, modifier) => {
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
    createSubmitResponse({
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
    createSubmitResponse({
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

    // ensure branches were covered
    expect(err1Called).to.equal(true)
    expect(err2Called).to.equal(true)
    expect(ups1Called).to.equal(2)
  })
})