/* eslint-env mocha */
import { expect } from 'chai'
import sinon from 'sinon'
import {
  observeDependencies,
  scheduleDependencies,
} from '../dependencyScheduler'

describe('dependency scheduler', () => {
  it('initializes contexts and schedules language, TTS and custom loaders', () => {
    const firstLoader = () => {}
    const secondLoader = () => {}
    const initLanguage = () => {}
    const initializeTTS = () => {}
    const contexts = [{ name: 'first' }, { name: 'second' }]
    const initClientContext = sinon.spy()
    const loadOnce = sinon.stub().callsFake((loader) => ({ loader }))
    const onError = sinon.spy()
    const debug = sinon.spy()

    const handles = scheduleDependencies({
      contexts,
      language: true,
      tts: true,
      loaders: [firstLoader, secondLoader],
      initClientContext,
      initLanguage,
      initializeTTS,
      loadOnce,
      onError,
      debug,
    })

    expect(
      initClientContext.args.map(([context]) => context.name),
    ).to.deep.equal(['first', 'second'])
    expect(handles).to.have.length(4)
    expect(loadOnce.args.map(([loader]) => loader)).to.deep.equal([
      initLanguage,
      initializeTTS,
      firstLoader,
      secondLoader,
    ])
    expect(loadOnce.args[0][1]).to.deep.equal({ onError, name: 'language' })
    expect(loadOnce.args[1][1]).to.deep.equal({ onError, name: 'tts', debug })
    expect(loadOnce.args[2][1]).to.deep.equal({ onError })
  })

  it('completes immediately when no dependency is requested', () => {
    const onComplete = sinon.spy()
    const autorun = sinon.spy()

    expect(
      observeDependencies({
        pending: [],
        autorun,
        onComplete,
      }),
    ).to.equal(undefined)
    expect(onComplete.calledOnce).to.equal(true)
    expect(autorun.called).to.equal(false)
  })

  it('waits for every handle and completes exactly once', () => {
    const readiness = [false, false]
    const pending = readiness.map((value, index) => ({
      get: () => readiness[index],
    }))
    const onComplete = sinon.spy()
    const stop = sinon.spy()
    let computation
    observeDependencies({
      pending,
      autorun: (callback) => {
        computation = callback
        callback({ stop })
      },
      onComplete,
    })

    readiness[0] = true
    computation({ stop })
    expect(onComplete.called).to.equal(false)
    readiness[1] = true
    computation({ stop })
    computation({ stop })
    expect(stop.calledOnce).to.equal(true)
    expect(onComplete.calledOnce).to.equal(true)
  })

  it('loads translations before completion', async () => {
    const translations = { de: () => ({}) }
    const loadTranslations = sinon.stub().resolves()
    const onComplete = sinon.spy()
    observeDependencies({
      pending: [{ get: () => true }],
      autorun: (callback) => callback({ stop: sinon.spy() }),
      translations,
      loadTranslations,
      onComplete,
    })

    expect(onComplete.called).to.equal(false)
    await Promise.resolve()
    await Promise.resolve()
    expect(loadTranslations.calledWith(translations)).to.equal(true)
    expect(onComplete.calledOnce).to.equal(true)
  })

  it('reports translation failure and still releases the template once', async () => {
    const expected = new Error('translation failed')
    const onTranslationError = sinon.spy()
    const onComplete = sinon.spy()
    observeDependencies({
      pending: [{ get: () => true }],
      autorun: (callback) => callback({ stop: sinon.spy() }),
      translations: { de: () => ({}) },
      loadTranslations: sinon.stub().rejects(expected),
      onTranslationError,
      onComplete,
    })

    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
    expect(onTranslationError.calledWith(expected)).to.equal(true)
    expect(onComplete.calledOnce).to.equal(true)
  })
})
