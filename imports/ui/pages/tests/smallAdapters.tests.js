/* eslint-env mocha */
import { expect } from 'chai'
import { Blaze } from 'meteor/blaze'
import { Meteor } from 'meteor/meteor'
import sinon from 'sinon'
import { LeaMarkdown } from '../../../api/markdown/LeaMarkdown'
import { createBlazeHarness } from '../../../../tests/blazeHarness'
import '../legal/legal'
import '../loading/loading'
import '../login/login'
import '../logout/logout'
import '../notfound/notFound'

const installDependencies = (
  sandbox,
  configure = (_instance, options) => options.onComplete(),
) =>
  sandbox
    .stub(Blaze.TemplateInstance.prototype, 'initDependencies')
    .callsFake(function (options) {
      this.api = {
        callMethod: sinon.spy(),
        debug: sinon.spy(),
        fadeIn: (_target, callback) => callback(),
        fadeOut: (_target, callback) => callback(),
        info: sinon.spy(),
        queryParam: sinon.spy(),
        sendError: sinon.spy(),
      }
      configure(this, options)
      return this
    })

const installJQueryMethod = (sandbox, name, implementation) => {
  if (window.$.fn[name]) {
    return sandbox.stub(window.$.fn, name).callsFake(implementation)
  }
  const method = sandbox.spy(implementation)
  sandbox.define(window.$.fn, name, method)
  return method
}

const settle = async (harness) => {
  await Promise.resolve()
  await Promise.resolve()
  await harness.flush()
}

describe('small page Blaze adapters', () => {
  let sandbox
  let harness

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    harness = createBlazeHarness()
  })

  afterEach(async () => {
    await harness.cleanup()
    sandbox.restore()
  })

  it('releases the loading page for dependency success and failure', async () => {
    let fail = false
    installDependencies(sandbox, (_instance, options) => {
      if (fail) options.onError(new Error('unavailable'))
      else options.onComplete()
    })

    const successful = await harness.render('loading', { title: 'Please wait' })
    expect(successful.instance.state.get('loadComplete')).to.equal(true)
    expect(successful.host.textContent).to.include('Please wait')
    await harness.cleanup()

    fail = true
    const failed = await harness.render('loading')
    expect(failed.instance.state.get('loadComplete')).to.equal(true)
  })

  it('renders the unauthenticated and authenticated login states', async () => {
    const userId = sandbox.stub(Meteor, 'userId').returns(null)
    const user = sandbox.stub(Meteor, 'user').returns(null)

    const loggedOut = await harness.render('login', { next: '/overview' })
    expect(loggedOut.instance.state.get('view')).to.equal('login')
    expect(loggedOut.host.querySelector('.login-button')).to.not.equal(null)
    await harness.cleanup()

    userId.returns('user')
    user.returns({ _id: 'user' })
    const loggedIn = await harness.render('login', { next: '/overview' })
    expect(loggedIn.instance.state.get('view')).to.equal('loggedIn')
    expect(loggedIn.host.querySelector('a[href="/overview"]')).to.not.equal(
      null,
    )
  })

  it('handles successful, rejected and synchronous login attempts', async () => {
    sandbox.stub(Meteor, 'userId').returns(null)
    sandbox.stub(Meteor, 'user').returns(null)
    const loginWithLea = sandbox.stub(Meteor, 'loginWithLea')
    const rendered = await harness.render('login')
    const button = rendered.host.querySelector('.login-button')

    loginWithLea.callsFake((callback) => callback())
    await harness.dispatch(button, 'click')
    expect(rendered.instance.state.get('loggingIn')).to.equal(false)

    const rejected = {
      error: 'oauth-denied',
      reason: 'Login denied',
      details: { data: { retry: false } },
    }
    loginWithLea.callsFake((callback) => callback(rejected))
    await harness.dispatch(button, 'click')
    expect(rendered.instance.state.get('loginError')).to.deep.equal({
      name: 'oauth-denied',
      reason: 'Login denied',
      details: '{"retry":false}',
    })
    expect(rendered.host.textContent).to.include('Login denied')

    const thrown = Object.assign(new Error('synchronous failure'), {
      error: 'oauth-sync',
      reason: 'Synchronous denial',
    })
    loginWithLea.throws(thrown)
    await harness.dispatch(button, 'click')
    expect(rendered.instance.state.get('loginError')).to.include({
      name: 'oauth-sync',
      reason: 'Synchronous denial',
    })
    expect(rendered.instance.state.get('loggingIn')).to.equal(false)
  })

  it('logs out after dependencies load and exposes transport errors', async () => {
    const expected = new Error('logout transport failed')
    sandbox.stub(console, 'error')
    const logout = sandbox
      .stub(Meteor, 'logout')
      .callsFake((callback) => callback(expected))
    installDependencies(sandbox)

    const rendered = await harness.render('logout')

    expect(logout.calledOnce).to.equal(true)
    expect(console.error.calledWith(expected)).to.equal(true)
    expect(rendered.instance.state.get('dependenciesComplete')).to.equal(true)
    expect(rendered.instance.state.get('loggedOut')).to.equal(true)
    expect(rendered.host.querySelector('a[href="/"]')).to.not.equal(null)
  })

  it('returns from not-found through its rendered action', async () => {
    const clock = sandbox.useFakeTimers({
      shouldClearNativeTimers: true,
      toFake: ['setTimeout', 'clearTimeout'],
    })
    installDependencies(sandbox)
    installJQueryMethod(sandbox, 'fadeOut', function (_speed, callback) {
      callback()
      return this
    })
    const next = sandbox.spy()
    const rendered = await harness.render('notFound', { next })

    expect(rendered.instance.state.get('dependenciesComplete')).to.equal(true)
    await harness.dispatch(
      rendered.host.querySelector('.lea-pagenotfound-button'),
      'click',
    )
    await clock.tickAsync(0)

    expect(next.calledOnceWithExactly()).to.equal(true)
  })

  it('loads and renders the selected legal document and navigates back', async () => {
    installDependencies(sandbox)
    sandbox.stub(LeaMarkdown, 'parse').resolves('<h1>Privacy policy</h1>')
    sandbox.stub(Meteor, 'call').callsFake((_name, args, callback) => {
      expect(args).to.deep.equal({ name: 'privacy' })
      callback(null, { value: '# Privacy policy' })
    })
    const back = sandbox.stub(window.history, 'back')

    const rendered = await harness.render('legal', {
      params: { type: 'datenschutz' },
    })
    await settle(harness)

    expect(rendered.instance.state.get('type')).to.equal('privacy')
    expect(rendered.instance.state.get('content')).to.include('Privacy policy')
    expect(rendered.host.textContent).to.include('Privacy policy')
    await harness.dispatch(rendered.host.querySelector('.back-button'), 'click')
    expect(back.calledOnceWithExactly()).to.equal(true)
  })

  it('shows legal method and markdown failures without leaking rejections', async () => {
    installDependencies(sandbox)
    const methodError = new Error('legal document missing')
    const call = sandbox
      .stub(Meteor, 'call')
      .callsFake((_name, _args, callback) => callback(methodError))
    const missing = await harness.render('legal', {
      params: { type: 'unknown-document' },
    })
    await settle(harness)

    expect(call.firstCall.args[1]).to.deep.equal({ name: undefined })
    expect(missing.instance.state.get('error')).to.deep.equal({})
    await harness.cleanup()

    const parseError = new Error('markdown rejected')
    sandbox.stub(console, 'error')
    call.callsFake((_name, _args, callback) =>
      callback(null, { value: '# Broken' }),
    )
    sandbox.stub(LeaMarkdown, 'parse').rejects(parseError)
    const invalidMarkdown = await harness.render('legal', {
      params: { type: 'impressum' },
    })
    await settle(harness)

    expect(invalidMarkdown.instance.state.get('error')).to.deep.equal({})
    expect(console.error.calledWith(parseError)).to.equal(true)
  })
})
