/* eslint-env mocha */
import { expect } from 'chai'
import sinon from 'sinon'
import {
  completionNavigation,
  completionStates,
  completionViewIndex,
  createCompletionFailureState,
  createResponseDetailsLoader,
  resolveCompletionSession,
  resolveCompletionView,
  shouldLoadResponses,
} from '../completeBehavior'

describe('completion behavior', () => {
  const createState = (initial = {}) => {
    const values = new Map(Object.entries(initial))
    return {
      get: (key) => values.get(key),
      set(key, value) {
        if (typeof key === 'object') {
          Object.entries(key).forEach(([name, entry]) => values.set(name, entry))
        } else {
          values.set(key, value)
        }
      },
      snapshot: () => Object.fromEntries(values),
    }
  }

  it('maps query values to stable completion views', () => {
    expect(resolveCompletionView()).to.equal(completionStates.showResults)
    expect(resolveCompletionView('1')).to.equal(completionStates.showDecision)
    expect(resolveCompletionView(2)).to.equal(completionStates.showFailed)
    expect(resolveCompletionView('invalid')).to.equal(completionStates.showResults)
    expect(resolveCompletionView(99)).to.equal(completionStates.showResults)
    expect(completionViewIndex(completionStates.showDecision)).to.equal(1)
  })

  it('creates a renderable failure state with Meteor and Error fallbacks', () => {
    expect(
      createCompletionFailureState({ error: 'session.failed', reason: 'reason' }),
    ).to.deep.equal({
      competenciesLoaded: true,
      sessionLoaded: true,
      failed: { error: 'session.failed', reason: 'reason' },
    })
    expect(createCompletionFailureState(new Error('broken')).failed).to.deep.equal(
      { error: 'error.default', reason: 'broken' },
    )
    expect(createCompletionFailureState().failed).to.equal(true)
  })

  it('routes incomplete sessions away and exposes completed session data', () => {
    expect(
      resolveCompletionSession({
        sessionData: { action: 'exit', sessionId: 'session' },
        sessionId: 'session',
      }),
    ).to.deep.equal({ action: 'exit', args: { sessionId: 'session' } })
    expect(
      resolveCompletionSession({
        sessionData: { action: 'next' },
        sessionId: 'session',
      }),
    ).to.deep.equal({ action: 'exit', args: { sessionId: 'session' } })

    const state = { sessionLoaded: true, sessionDoc: { _id: 'session' } }
    expect(
      resolveCompletionSession({ sessionData: state, sessionId: 'session' }),
    ).to.deep.equal({ action: 'show', state })
    expect(() =>
      resolveCompletionSession({ sessionData: undefined, sessionId: 'session' }),
    ).to.throw('Expected completion session data')
  })

  it('loads response details only once and only for debug users', () => {
    expect(
      shouldLoadResponses({ user: { debug: true }, callingResponses: false }),
    ).to.equal(true)
    expect(
      shouldLoadResponses({ user: { debug: true }, callingResponses: true }),
    ).to.equal(false)
    expect(
      shouldLoadResponses({ user: { debug: false }, callingResponses: false }),
    ).to.equal(false)
    expect(
      shouldLoadResponses({ user: undefined, callingResponses: false }),
    ).to.equal(false)
  })

  it('loads debug response details through one explicit adapter transition', async () => {
    const responses = [{ _id: 'response' }]
    const state = createState()
    const load = sinon.stub().resolves(responses)
    const onFailed = sinon.spy()
    const loader = createResponseDetailsLoader({
      sessionId: 'session',
      debug: sinon.spy(),
      load,
      onFailed,
    })

    expect(await loader.run({ user: { debug: true }, state })).to.equal(true)
    expect(state.snapshot()).to.deep.equal({
      callingResponses: false,
      responsesAttempted: true,
      responses,
      responsesLoaded: true,
    })
    expect(load.calledOnce).to.equal(true)
    expect(load.firstCall.args[0]).to.include({ sessionId: 'session' })
    expect(onFailed.called).to.equal(false)

    expect(await loader.run({ user: { debug: true }, state })).to.equal(false)
    expect(load.calledOnce).to.equal(true)
  })

  it('records a failed detail attempt once instead of reactive refetching', async () => {
    const expected = new Error('details rejected')
    const state = createState()
    const load = sinon.stub().rejects(expected)
    const onFailed = sinon.spy()
    const loader = createResponseDetailsLoader({
      sessionId: 'session',
      load,
      onFailed,
    })

    expect(await loader.run({ user: { debug: true }, state })).to.equal(false)
    expect(await loader.run({ user: { debug: true }, state })).to.equal(false)
    expect(load.calledOnce).to.equal(true)
    expect(onFailed.calledOnceWithExactly(expected)).to.equal(true)
    expect(state.snapshot()).to.include({
      callingResponses: false,
      responsesAttempted: true,
    })
  })

  it('stops pending response-detail lifecycle updates when destroyed', async () => {
    let resolveLoad
    const state = createState()
    const loader = createResponseDetailsLoader({
      sessionId: 'session',
      load: () =>
        new Promise((resolve) => {
          resolveLoad = resolve
        }),
      onFailed: sinon.spy(),
    })
    const pending = loader.run({ user: { debug: true }, state })
    loader.stop()
    const stoppedState = state.snapshot()
    resolveLoad([{ _id: 'late' }])

    expect(await pending).to.equal(false)
    expect(state.snapshot()).to.deep.equal(stoppedState)
  })

  it('maps completion buttons onto external navigation callbacks', () => {
    expect(completionNavigation('end')).to.equal('end')
    expect(completionNavigation('continue')).to.equal('next')
    expect(completionNavigation('overview')).to.equal('next')
    expect(completionNavigation('unknown')).to.equal(undefined)
  })
})
