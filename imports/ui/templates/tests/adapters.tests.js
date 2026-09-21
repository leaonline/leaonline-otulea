/* eslint-env mocha */
import { expect } from 'chai'
import { Blaze } from 'meteor/blaze'
import { Template } from 'meteor/templating'
import { Tracker } from 'meteor/tracker'
import sinon from 'sinon'
import { Router } from '../../routing/Router'
import { createTTS } from '../../renderers/defaultMarkdownRenderer'
import '../initDependencies'
import '../initMarkdownRenderer'
import './markdownFixture.html'

describe('template runtime adapters', () => {
  let sandbox

  beforeEach(() => {
    sandbox = sinon.createSandbox()
  })

  afterEach(() => sandbox.restore())

  it('normalizes markdown TTS input and schedules a sound button', async () => {
    const clock = sandbox.useFakeTimers({
      shouldClearNativeTimers: true,
      toFake: ['setTimeout', 'clearTimeout'],
    })
    const renderWithData = sandbox.stub(Blaze, 'renderWithData')
    const host = document.createElement('div')
    document.body.appendChild(host)

    const markup = createTTS(
      [{ text: 'Read ' }, { ignored: true }, { text: 'this' }],
      { color: 'danger', type: 'info' },
    )
    host.innerHTML = markup
    await clock.tickAsync(300)

    expect(markup).to.match(/^<span id="markdown-tts-[A-Za-z0-9]{6}"><\/span>$/)
    expect(renderWithData.calledOnce).to.equal(true)
    expect(renderWithData.firstCall.args[0]).to.equal(Template.soundbutton)
    expect(renderWithData.firstCall.args[1]).to.deep.equal({
      text: 'Read this',
      outline: true,
      sm: true,
      type: 'danger',
      class: 'border-0 me-2',
    })
    expect(renderWithData.firstCall.args[2]).to.equal(host.firstElementChild)
    host.remove()
  })

  it('accepts string TTS input and rejects empty token collections', () => {
    const clock = sandbox.useFakeTimers({
      shouldClearNativeTimers: true,
      toFake: ['setTimeout', 'clearTimeout'],
    })
    sandbox.stub(Blaze, 'renderWithData')
    sandbox.stub(console, 'warn')

    expect(createTTS([], {})).to.equal('')
    expect(createTTS([{ text: 42 }], {})).to.equal('')
    expect(console.warn.callCount).to.equal(2)

    const markup = createTTS('Speak', { type: 'warning' })
    const host = document.createElement('div')
    host.innerHTML = markup
    document.body.appendChild(host)
    clock.tick(300)
    expect(Blaze.renderWithData.firstCall.args[1]).to.include({
      text: 'Speak',
      type: 'warning',
    })
    host.remove()
  })

  it('renders markdown block content through the registered helper', () => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const view = Blaze.render(Template.markdownTestFixture, host)

    Tracker.flush()

    expect(host.querySelector('h1')?.textContent).to.equal('Rendered heading')
    Blaze.remove(view)
    Tracker.flush()
    host.remove()
  })

  it('wires the existing template API and completes without dependencies', () => {
    const queryParam = sandbox.stub(Router, 'queryParam').returns('query value')
    const onComplete = sandbox.stub().returns('complete')
    const instance = {
      view: { name: 'Template.testDependencies' },
      autorun: (callback) => Tracker.autorun(callback),
    }

    const result = Blaze.TemplateInstance.prototype.initDependencies.call(
      instance,
      { onComplete },
    )

    expect(result).to.equal('complete')
    expect(onComplete.calledOnceWithExactly()).to.equal(true)
    expect(instance.api.queryParam('v')).to.equal('query value')
    expect(queryParam.calledOnceWithExactly('v')).to.equal(true)
    expect(instance.api.hasProperty({ value: true }, 'value')).to.equal(true)
    expect(instance.api).to.include.keys(
      'callMethod',
      'debug',
      'fadeIn',
      'fadeOut',
      'info',
      'isDebugUser',
      'loadAllContentDocs',
      'loadContentDoc',
      'sendError',
    )
  })

  it('waits for a custom dependency and completes exactly once', async () => {
    let resolveLoader
    const loader = sandbox.stub().returns(
      new Promise((resolve) => {
        resolveLoader = resolve
      }),
    )
    const onComplete = sandbox.spy()
    const instance = {
      view: { name: 'Template.asyncDependencies' },
      autorun: (callback) => Tracker.autorun(callback),
    }

    const result = Blaze.TemplateInstance.prototype.initDependencies.call(
      instance,
      { loaders: [loader], onComplete },
    )
    expect(result).to.equal(instance)
    expect(onComplete.called).to.equal(false)

    resolveLoader()
    await Promise.resolve()
    await Promise.resolve()
    Tracker.flush()

    expect(loader.calledOnce).to.equal(true)
    expect(onComplete.calledOnceWithExactly()).to.equal(true)
    Tracker.flush()
    expect(onComplete.calledOnce).to.equal(true)
  })
})
