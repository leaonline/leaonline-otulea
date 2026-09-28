/* eslint-env mocha */
import { expect } from 'chai'
import sinon from 'sinon'
import { createTTSInitializer } from '../createTTSInitializer'

const createHarness = ({ maxServerRetries = -1 } = {}) => {
  const configurations = []
  const engine = {
    modes: { server: 'server', browser: 'browser' },
    mode: 'server',
    configure: sinon.spy((configuration) => {
      configurations.push(configuration)
      engine.mode = configuration.mode
    }),
    defaults: sinon.spy(),
    replay: sinon.spy(),
  }
  const fatal = sinon.spy()
  const sendError = sinon.spy()
  const createError = sinon.spy(
    (details) => new Error(`normalized:${String(details)}`),
  )
  const initialize = createTTSInitializer({
    loadEngine: async () => engine,
    hash: (text) => `hash-${text}`,
    url: '/tts',
    maxServerRetries,
    createError,
    fatal,
    sendError,
    logError: sinon.spy(),
  })
  return {
    initialize,
    engine,
    configurations,
    fatal,
    sendError,
    createError,
  }
}

const start = async (harness) => {
  const promise = harness.initialize(sinon.spy())
  await Promise.resolve()
  return { promise, initial: harness.configurations[0] }
}

describe('createTTSInitializer', () => {
  it('configures server TTS, resolves on completion and creates hashed URLs', async () => {
    const harness = createHarness()
    const { promise, initial } = await start(harness)
    const callback = sinon.spy()

    expect(initial.mode).to.equal('server')
    initial.loader('hello', callback, sinon.spy())
    expect(callback.calledWith(null, '/tts?hash=hash-hello')).to.equal(true)
    initial.onComplete()

    expect(await promise).to.equal(harness.engine)
    expect(harness.engine.defaults.calledWith({ rate: 0.8 })).to.equal(true)
    expect(harness.fatal.called).to.equal(false)
  })

  it('normalizes and reports initial configuration failures before resolving', async () => {
    const harness = createHarness()
    const { promise, initial } = await start(harness)
    initial.onError('speech unavailable')

    expect(await promise).to.equal(harness.engine)
    expect(harness.createError.calledWith('speech unavailable')).to.equal(true)
    const normalized = harness.createError.firstCall.returnValue
    expect(
      harness.fatal.calledWith({
        error: { message: 'tts.failed', original: normalized.message },
      }),
    ).to.equal(true)
    expect(harness.sendError.calledWith({ error: normalized })).to.equal(true)
  })

  it('falls back to browser mode, replays and resets within the retry limit', async () => {
    const harness = createHarness({ maxServerRetries: 1 })
    const { promise, initial } = await start(harness)
    initial.onComplete()
    await promise

    initial.globalErrorHandler(new Error('server failed'))
    const browser = harness.configurations[1]
    expect(browser.mode).to.equal('browser')
    browser.onComplete()
    expect(harness.engine.replay.calledOnce).to.equal(true)
    expect(harness.engine.mode).to.equal('server')

    initial.globalErrorHandler(new Error('server failed again'))
    const secondBrowser = harness.configurations[2]
    secondBrowser.onComplete()
    expect(harness.engine.replay.calledTwice).to.equal(true)
    expect(harness.engine.mode).to.equal('browser')
  })

  it('keeps retrying server mode when the retry limit is unlimited', async () => {
    const harness = createHarness()
    const { promise, initial } = await start(harness)
    initial.onComplete()
    await promise
    initial.globalErrorHandler(new Error('server failed'))
    harness.configurations[1].onComplete()
    expect(harness.engine.mode).to.equal('server')
  })

  it('reports browser configuration and runtime failures', async () => {
    const harness = createHarness()
    const { promise, initial } = await start(harness)
    initial.onComplete()
    await promise
    initial.globalErrorHandler(new Error('server failed'))
    const browser = harness.configurations[1]

    browser.onError('browser setup failed')
    const normalized = harness.createError.firstCall.returnValue
    expect(harness.sendError.calledWith({ error: normalized })).to.equal(true)

    const runtimeError = new Error('browser runtime failed')
    browser.globalErrorHandler(runtimeError)
    expect(harness.sendError.calledWith({ error: runtimeError })).to.equal(true)
    expect(harness.fatal.callCount).to.equal(2)
  })

  it('uses a diagnostic fallback for an unknown engine mode', async () => {
    const debug = sinon.spy()
    const harness = createHarness()
    const promise = harness.initialize(debug)
    await Promise.resolve()
    const initial = harness.configurations[0]
    initial.onComplete()
    await promise
    harness.engine.mode = 'unknown'
    const error = new Error('unknown mode')
    initial.globalErrorHandler(error)
    expect(
      debug.calledWith('[initializeTTS]: globalErrorHandler fallback', error),
    ).to.equal(true)
  })
})
