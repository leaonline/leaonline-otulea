/* eslint-env mocha */
import { Random } from 'meteor/random'
import { Mongo } from 'meteor/mongo'
import { expect } from 'chai'
import { Session } from '../../session/Session'
import { HTTP } from 'meteor/jkuester:http'
import { Feedback } from '../Feedback'
import { Thresholds } from '../../thresholds/Thresholds'
import { AlphaLevel } from '../../AlphaLevel'
import {
  generateFeedback,
  countCompetencies,
  gradeCompetenciesAndCountAlphaLevels, gradeAlphaLevels
} from '../api/generateFeedback'
import { stub, restoreAll } from '../../../../tests/helpers.tests'
import { Competency } from '../../Competency'
import { Response } from '../../response/Response'

describe(countCompetencies.name, function () {
  it('correctly counts scored competencies', function () {
    const id1 = Random.id()
    const id2 = Random.id()
    const responses = [
      [
        { competency: [id1, id2], score: 'true' },
        { competency: [id1, id2], score: 'true' },
        { competency: [id1], score: 'false' }
      ]
    ]

    const minCountCompetency = 3
    const competencies = countCompetencies({ responses, minCountCompetency })

    expect(competencies.get(id1)).to.deep.equal({
      competencyId: id1,
      count: 3,
      scored: 2,
      undef: 0,
      min: minCountCompetency,
      perc: 2 / 3
    })

    expect(competencies.get(id2)).to.deep.equal({
      competencyId: id2,
      count: 2,
      scored: 2,
      undef: 0,
      min: minCountCompetency,
      perc: 1
    })
  })
})

describe(gradeCompetenciesAndCountAlphaLevels.name, function () {
  it('correctly grades competencies', function () {
    const cId1 = Random.id() // 3/3
    const cId2 = Random.id() // 2/3
    const cId3 = Random.id() // 0/3
    const cId4 = Random.id() // not passed

    const competencies = new Map()
    competencies.set(cId1, {
      competencyId: cId1,
      count: 3,
      scored: 3,
      undef: 0,
      min: 3,
      perc: 1
    })
    competencies.set(cId2, {
      competencyId: cId2,
      count: 3,
      scored: 2,
      undef: 0,
      min: 3,
      perc: 2 / 3
    })
    competencies.set(cId3, {
      competencyId: cId3,
      count: 3,
      scored: 0,
      undef: 0,
      min: 3,
      perc: 0
    })
    competencies.set(cId4, {
      competencyId: cId4,
      count: 1,
      scored: 2,
      undef: 0,
      min: 3,
      perc: 0.5
    })

    const thresholds = [{
      max: 1,
      name: 'top'
    }, {
      max: 0.8,
      name: 'good'
    }, {
      max: 0.5,
      name: 'ok'
    }, {
      max: 0,
      name: 'bad'
    }]

    gradeCompetenciesAndCountAlphaLevels({
      competencies,
      thresholds,
      minCountAlphaLevel: 1,
      getCompetency: id => ({ _id: id }),
      getAlphaLevel: id => ({ _id: id })
    })

    expect(competencies.get(cId1)).to.deep.equal({
      competencyId: cId1,
      count: 3,
      scored: 3,
      undef: 0,
      min: 3,
      perc: 1,
      gradeName: 'top',
      gradeIndex: 0,
      isGraded: true
    })
    expect(competencies.get(cId2)).to.deep.equal({
      competencyId: cId2,
      count: 3,
      scored: 2,
      undef: 0,
      min: 3,
      perc: 2 / 3,
      gradeName: 'ok',
      gradeIndex: 2,
      isGraded: true
    })
    expect(competencies.get(cId3)).to.deep.equal({
      competencyId: cId3,
      count: 3,
      scored: 0,
      undef: 0,
      min: 3,
      perc: 0,
      gradeName: 'bad',
      gradeIndex: 3,
      isGraded: true
    })
    expect(competencies.get(cId4)).to.deep.equal({
      competencyId: cId4,
      count: 1,
      scored: 2,
      undef: 0,
      min: 3,
      perc: 0.5,
      gradeName: 'notEnough',
      gradeIndex: -1,
      isGraded: false
    })
  })
  it('correctly counts alphaLevels', function () {
    const cid1 = Random.id()
    const cid2 = Random.id()
    const aid = Random.id()
    const aDoc = { _id: aid }
    const cDoc1 = { _id: cid1, level: aid }
    const cDoc2 = { _id: cid2, level: aid }

    const competencies = new Map()
    competencies.set(cid1, {
      competencyId: cid1,
      count: 3,
      scored: 3,
      undef: 0,
      min: 3,
      perc: 1
    })
    competencies.set(cid2, {
      competencyId: cid2,
      count: 3,
      scored: 3,
      undef: 0,
      min: 3,
      perc: 1
    })

    const getCompetency = id => {
      if (id === cid1) return cDoc1
      if (id === cid2) return cDoc2
    }
    const getAlphaLevel = id => {
      if (id === aid) return aDoc
    }

    const thresholds = [{
      max: 1,
      name: 'top'
    }, {
      max: 0.8,
      name: 'good'
    }, {
      max: 0.5,
      name: 'ok'
    }, {
      max: 0,
      name: 'bad'
    }]

    const alphaLevels = gradeCompetenciesAndCountAlphaLevels({
      competencies,
      getAlphaLevel,
      getCompetency,
      thresholds,
      minCountAlphaLevel: 2
    })

    expect(alphaLevels.get(aid)).to.deep.equal({
      alphaLevelId: aid,
      count: 2,
      min: 2,
      perc: 1,
      scored: 2
    })
  })
})

describe(gradeAlphaLevels.name, function () {
  it('correctly grades alpha levels', function () {
    const thresholds = [{
      max: 1,
      name: 'top'
    }, {
      max: 0.5,
      name: 'good'
    }, {
      max: 0.3,
      name: 'ok'
    }, {
      max: 0,
      name: 'bad'
    }]

    const aid1 = Random.id() // 3 / 3
    const aid2 = Random.id() // 2 / 3
    const aid3 = Random.id() // 1 / 3
    const aid4 = Random.id() // 0 / 3
    const aid5 = Random.id() // not reached min count

    const alphaLevels = new Map()
    alphaLevels.set(aid1, {
      alphaLevelId: aid1,
      min: 3,
      count: 3,
      scored: 3,
      perc: 1
    })
    alphaLevels.set(aid2, {
      alphaLevelId: aid2,
      min: 3,
      count: 3,
      scored: 2,
      perc: 2 / 3
    })
    alphaLevels.set(aid3, {
      alphaLevelId: aid3,
      min: 3,
      count: 3,
      scored: 1,
      perc: 1 / 3
    })
    alphaLevels.set(aid4, {
      alphaLevelId: aid4,
      min: 3,
      count: 3,
      scored: 0,
      perc: 0
    })
    alphaLevels.set(aid5, {
      alphaLevelId: aid5,
      min: 3,
      count: 2,
      scored: 2,
      perc: 1
    })

    gradeAlphaLevels({ alphaLevels, thresholds })

    expect(alphaLevels.get(aid1)).to.deep.equal({
      alphaLevelId: aid1,
      min: 3,
      count: 3,
      scored: 3,
      perc: 1,
      gradeName: 'top',
      gradeIndex: 0,
      isGraded: true
    })

    expect(alphaLevels.get(aid2)).to.deep.equal({
      alphaLevelId: aid2,
      min: 3,
      count: 3,
      scored: 2,
      perc: 2 / 3,
      gradeName: 'good',
      gradeIndex: 1,
      isGraded: true
    })

    expect(alphaLevels.get(aid3)).to.deep.equal({
      alphaLevelId: aid3,
      min: 3,
      count: 3,
      scored: 1,
      perc: 1 / 3,
      gradeName: 'ok',
      gradeIndex: 2,
      isGraded: true
    })

    expect(alphaLevels.get(aid4)).to.deep.equal({
      alphaLevelId: aid4,
      min: 3,
      count: 3,
      scored: 0,
      perc: 0,
      gradeName: 'bad',
      gradeIndex: 3,
      isGraded: true
    })

    expect(alphaLevels.get(aid5)).to.deep.equal({
      alphaLevelId: aid5,
      min: 3,
      count: 2,
      scored: 2,
      perc: 1,
      gradeName: 'notEnough',
      gradeIndex: -1,
      isGraded: false
    })
  })
})

describe(generateFeedback.name, function () {
  afterEach(function () {
    restoreAll()
  })
  it('throws if session is not done yet', function () {
    const sessionId = Random.id()
    const userId = Random.id()
    const doc = {
      _id: sessionId
    }

    // session doc does not exist
    expect(() => generateFeedback({
      sessionId,
      userId
    })).to.throw('generateFeedback.sessionNotComplete')

    stub(Session, 'collection', () => ({
      findOne () {
        return doc
      }
    }))

    // session doc is not complete
    expect(() => generateFeedback({
      sessionId,
      userId
    })).to.throw('generateFeedback.sessionNotComplete')
  })

  it('returns a cached feedback, if one exists', function () {
    const doc = { _id: Random.id() }
    stub(Feedback, 'collection', () => ({
      findOne () {
        return doc
      }
    }))

    const existing = generateFeedback({})
    expect(existing).to.deep.equal(doc)
  })

  it('correctly grades a session', function () {
    const userId = Random.id()
    const FeedbackCollection = new Mongo.Collection(null)
    const SessionCollection = new Mongo.Collection(null)
    const ResponseCollection = new Mongo.Collection(null)

    stub(Feedback, 'collection', () => FeedbackCollection)
    stub(Session, 'collection', () => SessionCollection)
    stub(Response, 'collection', () => ResponseCollection)

    // create sessionDoc
    const testCycle = Random.id()
    const sessionId = SessionCollection.insert({
      completedAt: new Date(),
      progress: 100,
      maxProgress: 100,
      testCycle
    })

    // mock thresholds
    const thresholds = {
      minCountCompetency: 2,
      thresholdsCompetency: {
        good: 0.8,
        ok: 0.6,
        bad: 0
      },
      minCountAlphaLevel: 2,
      thresholdsAlphaLevel: {
        good: 0.8,
        ok: 0.6,
        bad: 0
      }
    }

    // mock competency and alphalevel docs from content server
    const aid = Random.id()
    const aDoc = { _id: aid }

    const cid1 = Random.id()
    const cid2 = Random.id()
    const cid3 = Random.id()
    const cDoc1 = { _id: cid1, level: aid }
    const cDoc2 = { _id: cid2, level: aid }
    const cDoc3 = { _id: cid3, level: aid }

    // stubbing fetch to content server
    stub(HTTP, 'get', (url, params) => {
      if (url.includes(Thresholds.routes.all.path)) {
        return { data: thresholds }
      }

      if (url.includes(AlphaLevel.routes.all.path)) {
        return { data: [aDoc] }
      }

      if (url.includes(Competency.routes.all.path)) {
        return { data: [cDoc1, cDoc2, cDoc3] }
      }

      throw new Error(url)
    })

    // /////////////////////////////////////////////////////////////////////////
    // CASE 1 - All perfect and graded
    // /////////////////////////////////////////////////////////////////////////

    ResponseCollection.insert({
      userId,
      sessionId,
      scores: [
        { competency: [cid1, cid1], score: 'true' },
        { competency: [cid1], score: 'true' },
        { competency: [cid2], score: 'true' }
      ]
    })

    ResponseCollection.insert({
      userId,
      sessionId,
      scores: [
        { competency: [cid1, cid1], score: 'true' },
        { competency: [cid1], score: 'true' },
        { competency: [cid2], score: 'true' }
      ]
    })

    const { _id, ...feedbackDoc } = generateFeedback({
      sessionId,
      userId
    })

    expect(feedbackDoc).to.deep.equal({
      userId,
      sessionId,
      testCycle,
      alphaLevels: [{
        alphaLevelId: aid,
        count: 2,
        gradeIndex: 0,
        gradeName: 'good',
        isGraded: true,
        min: 2,
        perc: 1,
        scored: 2
      }],
      competencies: [{
        competencyId: cid1,
        count: 6,
        gradeIndex: 0,
        gradeName: 'good',
        isGraded: true,
        min: 2,
        perc: 1,
        scored: 6,
        undef: 0
      }, {
        competencyId: cid2,
        count: 2,
        gradeIndex: 0,
        gradeName: 'good',
        isGraded: true,
        min: 2,
        perc: 1,
        scored: 2,
        undef: 0
      }]
    })

    // /////////////////////////////////////////////////////////////////////////
    // CASE 2 - All false
    // /////////////////////////////////////////////////////////////////////////
    ResponseCollection.remove({})
    FeedbackCollection.remove({})

    expect(ResponseCollection.find().count()).to.equal(0)

    ResponseCollection.insert({
      userId,
      sessionId,
      scores: [
        { competency: [cid1, cid1], score: 'false' },
        { competency: [cid1], score: 'false' },
        { competency: [cid2], score: 'false' }
      ]
    })

    ResponseCollection.insert({
      userId,
      sessionId,
      scores: [
        { competency: [cid1, cid1], score: 'false' },
        { competency: [cid1], score: 'false' },
        { competency: [cid2], score: 'false' }
      ]
    })

    const feedbackDoc2 = generateFeedback({
      sessionId,
      userId
    })

    delete feedbackDoc2._id

    expect(feedbackDoc2).to.deep.equal({
      userId,
      sessionId,
      testCycle,
      alphaLevels: [{
        alphaLevelId: aid,
        count: 2,
        gradeIndex: 2,
        gradeName: 'bad',
        isGraded: true,
        min: 2,
        perc: 0,
        scored: 0
      }],
      competencies: [{
        competencyId: cid1,
        count: 6,
        gradeIndex: 2,
        gradeName: 'bad',
        isGraded: true,
        min: 2,
        perc: 0,
        scored: 0,
        undef: 0
      }, {
        competencyId: cid2,
        count: 2,
        gradeIndex: 2,
        gradeName: 'bad',
        isGraded: true,
        min: 2,
        perc: 0,
        scored: 0,
        undef: 0
      }]
    })
    // /////////////////////////////////////////////////////////////////////////
    // CASE 3 - 2 True + 1 not enough
    // /////////////////////////////////////////////////////////////////////////
    ResponseCollection.remove({})
    FeedbackCollection.remove({})

    expect(ResponseCollection.find().count()).to.equal(0)

    ResponseCollection.insert({
      userId,
      sessionId,
      scores: [
        { competency: [cid1, cid1], score: 'true' },
        { competency: [cid1], score: 'true' },
        { competency: [cid2], score: 'true' }
      ]
    })

    ResponseCollection.insert({
      userId,
      sessionId,
      scores: [
        { competency: [cid1, cid1], score: 'true' },
        { competency: [cid1], score: 'true' },
        { competency: [cid2], score: 'true' },
        { competency: [cid3], score: 'true' }
      ]
    })

    const feedbackDoc3 = generateFeedback({
      sessionId,
      userId
    })

    delete feedbackDoc3._id

    expect(feedbackDoc3).to.deep.equal({
      userId,
      sessionId,
      testCycle,
      alphaLevels: [{
        alphaLevelId: aid,
        count: 2,
        gradeIndex: 0,
        gradeName: 'good',
        isGraded: true,
        min: 2,
        perc: 1,
        scored: 2
      }],
      competencies: [{
        competencyId: cid1,
        count: 6,
        gradeIndex: 0,
        gradeName: 'good',
        isGraded: true,
        min: 2,
        perc: 1,
        scored: 6,
        undef: 0
      }, {
        competencyId: cid2,
        count: 2,
        gradeIndex: 0,
        gradeName: 'good',
        isGraded: true,
        min: 2,
        perc: 1,
        scored: 2,
        undef: 0
      }, {
        competencyId: cid3,
        count: 1,
        gradeIndex: -1,
        gradeName: 'notEnough',
        isGraded: false,
        min: 2,
        perc: 1,
        scored: 1,
        undef: 0
      }]
    })

    // /////////////////////////////////////////////////////////////////////////
    // CASE 4 - 1 True + 1 false + 1 not enough
    // /////////////////////////////////////////////////////////////////////////
    ResponseCollection.remove({})
    FeedbackCollection.remove({})

    expect(ResponseCollection.find().count()).to.equal(0)

    ResponseCollection.insert({
      userId,
      sessionId,
      scores: [
        { competency: [cid1, cid1], score: 'true' },
        { competency: [cid1], score: 'true' },
        { competency: [cid2], score: 'false' }
      ]
    })

    ResponseCollection.insert({
      userId,
      sessionId,
      scores: [
        { competency: [cid1, cid1], score: 'true' },
        { competency: [cid1], score: 'true' },
        { competency: [cid2], score: 'false' },
        { competency: [cid3], score: 'true' }
      ]
    })

    const feedbackDoc4 = generateFeedback({
      sessionId,
      userId
    })

    delete feedbackDoc4._id

    expect(feedbackDoc4).to.deep.equal({
      userId,
      sessionId,
      testCycle,
      alphaLevels: [{
        alphaLevelId: aid,
        count: 2,
        gradeIndex: 2,
        gradeName: 'bad',
        isGraded: true,
        min: 2,
        perc: 0.5,
        scored: 1
      }],
      competencies: [{
        competencyId: cid1,
        count: 6,
        gradeIndex: 0,
        gradeName: 'good',
        isGraded: true,
        min: 2,
        perc: 1,
        scored: 6,
        undef: 0
      }, {
        competencyId: cid2,
        count: 2,
        gradeIndex: 2,
        gradeName: 'bad',
        isGraded: true,
        min: 2,
        perc: 0,
        scored: 0,
        undef: 0
      }, {
        competencyId: cid3,
        count: 1,
        gradeIndex: -1,
        gradeName: 'notEnough',
        isGraded: false,
        min: 2,
        perc: 1,
        scored: 1,
        undef: 0
      }]
    })
    // /////////////////////////////////////////////////////////////////////////
    // CASE 5 - 1 good + 1 best + 1 not enough
    // /////////////////////////////////////////////////////////////////////////
    ResponseCollection.remove({})
    FeedbackCollection.remove({})

    expect(ResponseCollection.find().count()).to.equal(0)

    ResponseCollection.insert({
      userId,
      sessionId,
      scores: [
        { competency: [cid1, cid1], score: 'true' },
        { competency: [cid1], score: 'false' },
        { competency: [cid2], score: 'true' }
      ]
    })

    ResponseCollection.insert({
      userId,
      sessionId,
      scores: [
        { competency: [cid1, cid1], score: 'true' },
        { competency: [cid1], score: 'true' },
        { competency: [cid2], score: 'true' },
        { competency: [cid3], score: 'true' }
      ]
    })

    const feedbackDoc5 = generateFeedback({
      sessionId,
      userId
    })

    delete feedbackDoc5._id

    expect(feedbackDoc5).to.deep.equal({
      userId,
      sessionId,
      testCycle,
      alphaLevels: [{
        alphaLevelId: aid,
        count: 2,
        gradeIndex: 0,
        gradeName: 'good',
        isGraded: true,
        min: 2,
        perc: (1 + (5 / 6)) / 2,
        scored: 1 + (5 / 6)
      }],
      competencies: [{
        competencyId: cid1,
        count: 6,
        gradeIndex: 0,
        gradeName: 'good',
        isGraded: true,
        min: 2,
        perc: 5 / 6,
        scored: 5,
        undef: 0
      }, {
        competencyId: cid2,
        count: 2,
        gradeIndex: 0,
        gradeName: 'good',
        isGraded: true,
        min: 2,
        perc: 1,
        scored: 2,
        undef: 0
      }, {
        competencyId: cid3,
        count: 1,
        gradeIndex: -1,
        gradeName: 'notEnough',
        isGraded: false,
        min: 2,
        perc: 1,
        scored: 1,
        undef: 0
      }]
    })
  })
})
