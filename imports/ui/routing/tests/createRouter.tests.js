/* eslint-env mocha */
import { expect } from 'chai'
import sinon from 'sinon'
import { createRouter } from '../createRouter'

const createHarness = (overrides = {}) => {
  const source = {
    go: sinon.stub().returns('gone'),
    current: sinon.stub().returns({ path: '/current', route: { name: 'home' } }),
    watchPathChange: sinon.spy(),
    setParams: sinon.stub().returns('params-set'),
    getParam: sinon.stub().returns('param-value'),
    setQueryParams: sinon.stub().returns('query-set'),
    getQueryParam: sinon.stub().returns('query-value'),
    route: sinon.stub().returns('registered'),
  }
  const dependencies = {
    source,
    routerHelpers: { name: sinon.stub().returns(true) },
    templateRegistry: {},
    loggingIn: () => false,
    autorun: (callback) => callback({ stop: sinon.spy() }),
    translate: (key) => key,
    documentRef: { title: '' },
    schedule: sinon.spy(),
    warn: sinon.spy(),
    ...overrides,
  }
  return { ...createRouter(dependencies), dependencies, source }
}

const routeDefinition = (overrides = {}) => ({
  key: 'unit',
  path: () => '/unit/:unitId',
  template: 'unit',
  target: 'main',
  label: 'routes.unit',
  load: sinon.stub().resolves('loaded'),
  ...overrides,
})

describe('createRouter', () => {
  it('provides path, parameter, location and helper facade behavior', () => {
    const { router, source, dependencies } = createHarness()
    const definition = routeDefinition()

    expect(router.go('/welcome')).to.equal('gone')
    expect(router.go({ path: (id) => `/unit/${id}` }, 'one')).to.equal('gone')
    expect(source.go.args.map(([value]) => value)).to.deep.equal([
      '/welcome',
      '/unit/one',
    ])
    expect(router.param({ unitId: 'one' })).to.equal('params-set')
    expect(router.param('unitId')).to.equal('param-value')
    expect(router.queryParam({ v: 1 })).to.equal('query-set')
    expect(router.queryParam('v')).to.equal('query-value')
    expect(router.location()).to.equal('/current')
    expect(router.location({ pathName: true })).to.equal('home')
    expect(router.current({ reactive: true })).to.deep.equal(
      source.current.firstCall.returnValue,
    )
    expect(source.watchPathChange.calledOnce).to.equal(true)
    expect(router.helpers.isActive('unit')).to.equal(true)
    expect(dependencies.routerHelpers.name.calledWith('unit')).to.equal(true)

    expect(router.register(definition)).to.equal('registered')
    expect(router.has('/unit/:unitId')).to.equal(definition)
    expect(source.route.firstCall.args[0]).to.equal('/unit/:unitId')
  })

  it('rejects unsupported facade argument types', () => {
    const { router } = createHarness()
    expect(() => router.go(4)).to.throw('expected string or object')
    expect(() => router.param(null)).to.throw('expected string or object')
    expect(() => router.queryParam(undefined)).to.throw(
      'expected string or object',
    )
  })

  it('renders loading only while a target template is unavailable', () => {
    const { router, createRouteLifecycle, dependencies } = createHarness()
    router.loadingTemplate('loading')
    const render = sinon.spy()
    const lifecycle = createRouteLifecycle(routeDefinition())

    lifecycle.whileWaiting.call({ render })
    expect(render.calledWith('main', 'loading')).to.equal(true)

    dependencies.templateRegistry.unit = {}
    lifecycle.whileWaiting.call({ render })
    expect(render.calledOnce).to.equal(true)

    delete dependencies.templateRegistry.unit
    createRouteLifecycle(routeDefinition({ showLoading: false }))
      .whileWaiting.call({ render })
    expect(render.calledOnce).to.equal(true)
  })

  it('waits for route loading and login completion', async () => {
    let loginPending = true
    let reactiveCallback
    const stop = sinon.spy()
    const definition = routeDefinition()
    const { createRouteLifecycle } = createHarness({
      loggingIn: () => loginPending,
      autorun: (callback) => {
        reactiveCallback = callback
        callback({ stop })
      },
    })
    let completed = false
    const waiting = createRouteLifecycle(definition)
      .waitOn()
      .then(() => {
        completed = true
      })

    await Promise.resolve()
    expect(completed).to.equal(false)
    loginPending = false
    reactiveCallback({ stop })
    await waiting
    expect(definition.load.calledOnce).to.equal(true)
    expect(stop.calledOnce).to.equal(true)
  })

  it('sets route data, refreshes untranslated titles and renders', () => {
    const translations = ['routes.unit', 'Unit']
    const translate = sinon.stub().callsFake(() => translations.shift())
    const schedule = sinon.spy()
    const onAction = sinon.spy()
    const data = { fixed: true }
    const definition = routeDefinition({ data, onAction })
    const { router, createRouteLifecycle, dependencies } = createHarness({
      templateRegistry: { unit: {} },
      translate,
      schedule,
    })
    const render = sinon.spy()
    router.titlePrefix('OTULEA')

    createRouteLifecycle(definition).action.call(
      { render },
      { unitId: 'one' },
      { debug: 'yes' },
    )

    expect(onAction.calledWith({ unitId: 'one' }, { debug: 'yes' })).to.equal(
      true,
    )
    expect(render.calledWith('main', 'unit', data)).to.equal(true)
    expect(data).to.include({ fixed: true })
    expect(data.params).to.deep.equal({ unitId: 'one' })
    expect(data.queryParams).to.deep.equal({ debug: 'yes' })
    expect(dependencies.documentRef.title).to.equal('OTULEA routes.unit')
    expect(schedule.firstCall.args[1]).to.equal(500)
    schedule.firstCall.args[0]()
    expect(dependencies.documentRef.title).to.equal('OTULEA Unit')
  })

  it('skips unloaded templates and routes render exceptions to onError', () => {
    const missing = createHarness()
    missing.createRouteLifecycle(routeDefinition()).action.call(
      { render: sinon.spy() },
      {},
      {},
    )
    expect(missing.dependencies.warn.calledOnce).to.equal(true)

    const expected = new Error('render failed')
    const onError = sinon.spy()
    const available = createHarness({ templateRegistry: { unit: {} } })
    available.createRouteLifecycle(routeDefinition(), onError).action.call(
      {
        render() {
          throw expected
        },
      },
      {},
      {},
    )
    expect(onError.calledWith(expected)).to.equal(true)
  })
})
