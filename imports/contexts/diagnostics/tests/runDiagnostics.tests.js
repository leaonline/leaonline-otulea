/* eslint-env mocha */
import { expect } from 'chai'
import { Meteor } from 'meteor/meteor'
import sinon from 'sinon'
import { TTSEngine } from '../../../api/tts/TTSEngine'
import { runDiagnostics } from '../api/runDiagnostics'

describe('runDiagnostics browser adapter', () => {
  let sandbox

  beforeEach(() => {
    sandbox = sinon.createSandbox()
  })

  afterEach(() => sandbox.restore())

  it('collects deterministic browser, storage, speech and graphics results', async () => {
    sandbox.stub(globalThis, 'setTimeout').returns(1)
    sandbox.stub(window.performance, 'mark')
    sandbox.stub(window.performance, 'measure')
    sandbox
      .stub(window.performance, 'getEntriesByName')
      .returns([{ duration: 12.5, startTime: 4.25 }])

    const worker = {
      scope: Meteor.absoluteUrl(),
      active: {},
      installing: null,
      waiting: {},
    }
    sandbox
      .stub(navigator.serviceWorker, 'getRegistrations')
      .resolves([
        { scope: undefined },
        { scope: 'https://unrelated.test/' },
        worker,
      ])

    const debugInfo = {
      UNMASKED_VENDOR_WEBGL: 'unmasked-vendor',
      UNMASKED_RENDERER_WEBGL: 'unmasked-renderer',
    }
    const gl = {
      SHADING_LANGUAGE_VERSION: 'shading',
      VENDOR: 'vendor',
      RENDERER: 'renderer',
      getExtension: sandbox.stub().returns(debugInfo),
      getParameter: sandbox.stub().callsFake((key) => key),
    }
    sandbox.stub(HTMLCanvasElement.prototype, 'getContext').returns(gl)

    sandbox
      .stub(TTSEngine, 'configure')
      .callsFake((options) => options.onComplete())
    sandbox.stub(TTSEngine, 'defaults')
    sandbox.stub(TTSEngine, 'isConfigured').returns(true)
    sandbox.stub(TTSEngine, 'play').callsFake(({ onEnd }) => onEnd())
    const debug = sandbox.spy()

    const results = await runDiagnostics({ debug })
    const byName = Object.fromEntries(
      results.map((entry) => [entry.name, entry]),
    )

    expect(results).to.have.length(9)
    expect(byName.localStorage.success).to.equal(true)
    expect(byName.serviceworker).to.include({
      status: 'found',
      success: true,
      active: true,
      installing: false,
      waiting: true,
    })
    expect(byName.tts).to.include({ status: 'successful', success: true })
    expect(byName.language.success).to.equal(true)
    expect(byName.screen.success).to.equal(true)
    expect(byName.graphics).to.include({
      gl: 'shading',
      glVendor: 'vendor',
      glRenderer: 'renderer',
      success: true,
    })
    expect(byName.performance).to.include({
      duration: 12.5,
      startTime: 4.25,
      success: true,
    })
    expect(byName.osinfo).to.have.property('browser')
    expect(debug.calledWith('runDiagnostics() return result')).to.equal(true)
    expect(TTSEngine.defaults.calledWith({ rate: 0.8 })).to.equal(true)
  })

  it('normalizes unavailable browser capabilities and speech failures', async () => {
    sandbox.stub(globalThis, 'setTimeout').returns(1)
    sandbox.stub(console, 'error')
    sandbox.stub(window.performance, 'mark')
    sandbox.stub(window.performance, 'measure')
    sandbox
      .stub(window.performance, 'getEntriesByName')
      .returns([{ duration: 0, startTime: 0 }])

    let serviceWorkerOwner = navigator
    while (
      serviceWorkerOwner &&
      !Object.getOwnPropertyDescriptor(serviceWorkerOwner, 'serviceWorker')
    ) {
      serviceWorkerOwner = Object.getPrototypeOf(serviceWorkerOwner)
    }
    sandbox.replaceGetter(serviceWorkerOwner, 'serviceWorker', () => undefined)
    sandbox.stub(HTMLCanvasElement.prototype, 'getContext').returns(null)
    sandbox
      .stub(Storage.prototype, 'setItem')
      .throws(new Error('storage denied'))
    sandbox.stub(TTSEngine, 'configure').throws(new Error('speech denied'))

    const results = await runDiagnostics()
    const byName = Object.fromEntries(
      results.map((entry) => [entry.name, entry]),
    )

    expect(byName.serviceworker.status).to.equal('notDefined')
    expect(byName.graphics.gl).to.equal('no webgl')
    expect(byName.localStorage.error.message).to.equal('storage denied')
    expect(byName.tts).to.include({ status: 'failed' })
    expect(byName.tts.error.message).to.equal('speech denied')
  })
})
