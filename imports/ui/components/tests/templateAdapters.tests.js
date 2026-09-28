/* eslint-env mocha */
import { expect } from 'chai'
import { Blaze } from 'meteor/blaze'
import sinon from 'sinon'
import { createBlazeHarness } from '../../../../tests/blazeHarness'
import { fatal } from '../fatal/fatal'
import { Logos } from '../../../contexts/logos/Logos'
import '../../layout/footer/footer'
import '../../layout/navbar/navbar'

const installDependencies = (sandbox, configure = () => {}) =>
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

const installJQueryMethod = (sandbox, instance, selector, name) => {
  const select = instance.$.bind(instance)
  const method = sandbox.spy(function () {
    return this
  })
  sandbox.stub(instance, '$').callsFake((target) => {
    const result = select(target)
    if (target === selector) result[name] = method
    return result
  })
  return method
}

const appendButton = (selector, parent) => {
  const element = document.createElement('button')
  element.className = selector.slice(1)
  parent.appendChild(element)
  return element
}

describe('shared Blaze template adapters', () => {
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

  it('renders fatal errors, opens the modal and clears it on dismissal', async () => {
    installDependencies(sandbox)

    const rendered = await harness.render('fatal')
    const modal = installJQueryMethod(
      sandbox,
      rendered.instance,
      '#fatal-modal',
      'modal',
    )
    fatal({ error: new Error('visible failure') })
    await harness.flush()

    expect(rendered.host.textContent).to.include('visible failure')
    rendered.instance.state.set('dependenciesComplete', true)
    await harness.flush()
    expect(modal.calledWith('show')).to.equal(true)

    await harness.dispatch(
      rendered.host.querySelector('#fatal-modal'),
      'hidden',
    )
    expect(rendered.host.textContent).to.not.include('visible failure')
  })

  it('releases fatal rendering after a dependency error', async () => {
    const expected = new Error('translation unavailable')
    sandbox.stub(console, 'error')
    installDependencies(sandbox, (_instance, options) =>
      options.onError(expected),
    )

    const { instance } = await harness.render('fatal')

    expect(instance.state.get('dependenciesComplete')).to.equal(true)
    expect(console.error.calledWith(expected)).to.equal(true)
  })

  it('derives navbar progress and confirms the exit callback', async () => {
    installDependencies(sandbox, (_instance, options) => options.onComplete())
    const onExit = sandbox.spy()
    const rendered = await harness.render('navbar', {
      sessionDoc: { progress: 1, maxProgress: 4 },
      unitSetDoc: { _id: 'set' },
      dimensionDoc: { title: 'Reading', colorType: 0 },
      levelDoc: { title: 'Level 1' },
      unitDoc: { shortCode: 'U1' },
      showProgress: true,
      onExit,
    })
    const modal = installJQueryMethod(
      sandbox,
      rendered.instance,
      '#navbar-modal',
      'modal',
    )

    expect(rendered.instance.state.get('progress')).to.include({
      current: 2,
      max: 4,
      rounded: 50,
    })
    expect(rendered.instance.state.get('labels')).to.include({
      dimension: 'Reading',
      level: 'Level 1',
    })
    expect(rendered.host.textContent).to.include('50%')

    const navbarActions = rendered.host.querySelector(
      '.d-flex.justify-content-between',
    )
    await harness.dispatch(
      appendButton('.navbar-overview-button', navbarActions),
      'click',
    )
    const modalElement = rendered.host.querySelector('#navbar-modal')
    await harness.dispatch(
      appendButton('.navbar-confirm-cancel', modalElement),
      'click',
    )
    await harness.dispatch(modalElement, 'hidden')

    expect(modal.calledWith('show'), 'opens the confirmation modal').to.equal(
      true,
    )
    expect(modal.calledWith('hide'), 'hides the confirmation modal').to.equal(
      true,
    )
    expect(onExit.calledOnceWithExactly(), 'calls the exit callback').to.equal(
      true,
    )
  })

  it('hides incomplete navbar progress and clears state on destroy', async () => {
    installDependencies(sandbox, (_instance, options) => options.onComplete())
    const rendered = await harness.render('navbar', {})

    expect(rendered.instance.state.get('showProgress')).to.equal(false)
    await harness.cleanup()
    expect(rendered.instance.state.all()).to.deep.equal({})
  })

  it('loads footer dependencies and logos after the delayed initialization', async () => {
    const clock = sandbox.useFakeTimers({
      shouldClearNativeTimers: true,
      toFake: ['setTimeout', 'clearTimeout'],
    })
    const logoDoc = {
      footer: [
        {
          href: 'https://example.test',
          title: 'Example',
          url: '/example.svg',
        },
      ],
    }
    sandbox
      .stub(Logos.methods.get, 'call')
      .callsFake((callback) => callback(null, logoDoc))
    installDependencies(sandbox, (_instance, options) => options.onComplete())

    const rendered = await harness.render('footer')
    expect(rendered.instance.state.get('logoDoc')).to.deep.equal(logoDoc)
    expect(rendered.instance.state.get('dependenciesComplete')).to.not.equal(
      true,
    )

    await clock.tickAsync(500)
    await harness.flush()

    expect(rendered.instance.state.get('dependenciesComplete')).to.equal(true)
    expect(
      rendered.host.querySelector('a[href="https://example.test"]'),
    ).to.not.equal(null)
  })

  it('keeps the footer usable when dependency and logo loading fail', async () => {
    const clock = sandbox.useFakeTimers({
      shouldClearNativeTimers: true,
      toFake: ['setTimeout', 'clearTimeout'],
    })
    const expected = new Error('logo unavailable')
    sandbox.stub(console, 'error')
    sandbox
      .stub(Logos.methods.get, 'call')
      .callsFake((callback) => callback(expected))
    installDependencies(sandbox, (_instance, options) =>
      options.onError(new Error('dependencies unavailable')),
    )

    const rendered = await harness.render('footer')
    await clock.tickAsync(500)
    await harness.flush()

    expect(rendered.instance.state.get('dependenciesComplete')).to.equal(true)
    expect(console.error.calledWith(expected)).to.equal(true)
  })
})
