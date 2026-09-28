/* eslint-env mocha */
import { expect } from 'chai'
import sinon from 'sinon'
import { createDataLoader } from '../helpers/loadData'
import { createResponsesLoader } from '../helpers/loadResponses'
import { createSessionDataLoader } from '../helpers/loadSessionData'

const collection = (documents) => ({
  findOne: (id) => documents[id],
})

const createDataHarness = ({ scored = true } = {}) => {
  const competencyDocuments = {
    a: { _id: 'a', shortCode: 'A', descriptionSimple: 'Alpha' },
    b: { _id: 'b', shortCode: 'B', descriptionSimple: 'Beta' },
  }
  const alphaDocuments = {
    x: {
      _id: 'x',
      shortCode: 'X',
      description: 'Level X',
      level: 2,
      dimension: 'dimension',
    },
  }
  const contexts = {
    Thresholds: { name: 'thresholds' },
    Session: { methods: { results: 'session.results' } },
    Competency: {
      name: 'competency',
      collection: () => collection(competencyDocuments),
    },
    AlphaLevel: {
      name: 'alphaLevel',
      collection: () => collection(alphaDocuments),
    },
    Dimension: {
      name: 'dimension',
      collection: () => collection({ dimension: { title: 'Reading' } }),
    },
  }
  const evaluation = {
    competencies: [
      {
        competencyId: 'b',
        gradeIndex: scored ? 1 : -1,
        gradeName: 'pass',
        perc: 0.567,
      },
      {
        competencyId: 'a',
        gradeIndex: -1,
        gradeName: 'none',
      },
    ],
    alphaLevels: [
      {
        alphaLevelId: 'x',
        gradeIndex: scored ? 0 : -1,
        gradeName: 'pass',
        perc: 0.789,
      },
    ],
  }
  const loadAll = sinon.stub().callsFake(({ context }) => {
    if (context.name === 'thresholds') return { thresholds: [{ _id: 't' }] }
    if (context.name === 'competency') {
      return { competency: Object.values(competencyDocuments) }
    }
    return { alphaLevel: Object.values(alphaDocuments) }
  })
  const methodCall = sinon.stub().resolves(evaluation)
  return { contexts, loadAll, methodCall, evaluation }
}

describe('completion loaders', () => {
  it('aggregates percentages, labels and deterministic competency ordering', async () => {
    const harness = createDataHarness()
    const debug = sinon.spy()
    const loadData = createDataLoader(harness)

    const result = await loadData({ sessionId: 'session', debug })

    expect(harness.methodCall.firstCall.args[0]).to.deep.equal({
      name: 'session.results',
      args: { sessionId: 'session' },
    })
    expect(
      result.aggregatedResults.map(({ shortCode }) => shortCode),
    ).to.deep.equal(['A', 'B'])
    expect(result.aggregatedResults[0]).to.include({
      description: 'Alpha',
      gradeLabel: 'thresholds.none',
      perc: 0,
    })
    expect(result.aggregatedResults[1].perc).to.equal(56)
    expect(result.alphaLevels[0]).to.include({
      dimension: 'Reading 2',
      gradeLabel: 'thresholds.pass',
      perc: 78,
    })
    expect(result.noScoredCompetencies).to.equal(false)
    expect(result.noScoredAlphas).to.equal(false)
    expect(result.competenciesLoaded).to.equal(true)
    expect(result.alphaLevelsLoaded).to.equal(true)
  })

  it('preserves the unscored state when no result has a grade', async () => {
    const harness = createDataHarness({ scored: false })
    const result = await createDataLoader(harness)({ sessionId: 'session' })
    expect(result.noScoredCompetencies).to.equal(true)
    expect(result.noScoredAlphas).to.equal(true)
  })

  it('rejects missing thresholds, evaluations and content documents', async () => {
    const missingThresholds = createDataHarness()
    missingThresholds.loadAll.callsFake(() => ({}))
    let error
    try {
      await createDataLoader(missingThresholds)({ sessionId: 'session' })
    } catch (runtimeError) {
      error = runtimeError
    }
    expect(error.reason).to.equal('loadError.noThresholds')

    missingThresholds.loadAll.callsFake(() => ({ thresholds: [] }))
    error = undefined
    try {
      await createDataLoader(missingThresholds)({ sessionId: 'session' })
    } catch (runtimeError) {
      error = runtimeError
    }
    expect(error.reason).to.equal('loadError.noThresholds')

    const missingEvaluation = createDataHarness()
    missingEvaluation.methodCall.resolves(undefined)
    try {
      await createDataLoader(missingEvaluation)({ sessionId: 'session' })
    } catch (runtimeError) {
      error = runtimeError
    }
    expect(error.reason).to.equal('loadError.noEvaluationResults')

    const missingCompetencies = createDataHarness()
    missingCompetencies.loadAll.callsFake(({ context }) =>
      context.name === 'thresholds' ? { thresholds: [{}] } : { competency: [] },
    )
    try {
      await createDataLoader(missingCompetencies)({ sessionId: 'session' })
    } catch (runtimeError) {
      error = runtimeError
    }
    expect(error.reason).to.equal('loadError.competenciesNotFound')
  })

  it('propagates orchestration failures unchanged', async () => {
    const expected = new Error('transport failed')
    const harness = createDataHarness()
    harness.loadAll.rejects(expected)
    let actual
    try {
      await createDataLoader(harness)({ sessionId: 'session' })
    } catch (error) {
      actual = error
    }
    expect(actual).to.equal(expected)
  })

  it('loads unique response units, maps fallbacks and sorts by unit code', async () => {
    const responses = [
      { _id: '2', unitId: 'b' },
      { _id: '1', unitId: 'a' },
      { _id: '3', unitId: 'missing' },
      { _id: '4', unitId: 'a' },
    ]
    const methodCall = sinon.stub().resolves(responses)
    const loadAll = sinon.stub().resolves({})
    const unitContext = {
      name: 'unit',
      collection: () =>
        collection({
          a: { _id: 'a', shortCode: 'A' },
          b: { _id: 'b', shortCode: 'B' },
        }),
    }
    const loadResponses = createResponsesLoader({
      methodCall,
      loadAll,
      responseContext: { methods: { getMy: 'responses.getMy' } },
      unitContext,
    })

    const result = await loadResponses({ sessionId: 'session' })

    expect(loadAll.firstCall.args[0].ids).to.deep.equal(['b', 'a', 'missing'])
    expect(result.map(({ unit }) => unit.shortCode)).to.deep.equal([
      '?',
      'A',
      'A',
      'B',
    ])
    expect(responses[0]).to.not.have.property('unit')
  })

  it('rejects malformed response loads and propagates unit-load failures', async () => {
    const loadResponses = createResponsesLoader({
      methodCall: sinon.stub().resolves(undefined),
      unitContext: {},
    })
    let error
    try {
      await loadResponses({ sessionId: 'session' })
    } catch (runtimeError) {
      error = runtimeError
    }
    expect(error.message).to.equal('Expected responses array')

    const expected = new Error('unit load failed')
    const failing = createResponsesLoader({
      methodCall: sinon.stub().resolves([]),
      loadAll: sinon.stub().rejects(expected),
      unitContext: {},
    })
    try {
      await failing({ sessionId: 'session' })
    } catch (runtimeError) {
      error = runtimeError
    }
    expect(error).to.equal(expected)
  })

  it('distinguishes missing, incomplete and completed session data', async () => {
    const sessionLoader = sinon.stub()
    const createLoader = sinon.stub().returns(sessionLoader)
    const loadSessionData = createSessionDataLoader({
      createLoader,
      isComplete: ({ completed }) => completed,
    })

    sessionLoader.resolves(undefined)
    expect(await loadSessionData({ sessionId: 'session' })).to.equal(undefined)

    sessionLoader.resolves({ sessionDoc: { completed: true } })
    expect(await loadSessionData({ sessionId: 'session' })).to.equal(undefined)

    const completeData = {
      sessionDoc: { completed: false },
      unitSetDoc: { _id: 'set' },
      dimensionDoc: { _id: 'dimension' },
      levelDoc: { _id: 'level' },
      color: 'blue',
    }
    sessionLoader.resolves(completeData)
    expect(await loadSessionData({ sessionId: 'session' })).to.deep.equal({
      action: 'exit',
      sessionId: 'session',
    })

    completeData.sessionDoc.completed = true
    expect(await loadSessionData({ sessionId: 'session' })).to.deep.equal({
      ...completeData,
      sessionLoaded: true,
    })
  })
})
