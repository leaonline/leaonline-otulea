/* eslint-env mocha */
import { expect } from 'chai'
import sinon from 'sinon'
import { createContentConnection } from '../ContentConnection'

const settings = {
  remotes: {
    content: {
      url: 'https://content.example.test',
      jwt: { key: 'key', sub: 'subject', expires: 60 },
    },
  },
}

const createHarness = () => {
  let onConnected
  let onTimeout
  const remote = {
    call: sinon.stub(),
    disconnect: sinon.spy(),
    status: sinon.stub().returns({ status: 'connected' }),
  }
  const ddpConnect = sinon.stub().callsFake((url, options) => {
    onConnected = options.onConnected
    return remote
  })
  const clearTimer = sinon.spy()
  const jwtFactory = sinon.stub().returns(({ name }) => `token:${name}`)
  const connection = createContentConnection({
    settings,
    absoluteUrl: () => 'https://app.example.test/',
    ddpConnect,
    jwtFactory,
    setTimer: (callback) => {
      onTimeout = callback
      return 42
    },
    clearTimer,
  })

  return {
    connection,
    remote,
    ddpConnect,
    jwtFactory,
    clearTimer,
    connected: (error) => onConnected(error),
    timeout: () => onTimeout(),
  }
}

describe('ContentConnection', () => {
  it('connects without retry and exposes the connected state', async () => {
    const harness = createHarness()
    const log = sinon.spy()
    expect(harness.connection.isConnected()).to.equal(false)

    const pending = harness.connection.connect({ log, timeout: 25 })
    expect(harness.ddpConnect.firstCall.args[0]).to.equal(settings.remotes.content.url)
    expect(harness.ddpConnect.firstCall.args[1].retry).to.equal(false)
    harness.connected()
    await pending

    expect(harness.connection.isConnected()).to.equal(true)
    expect(harness.clearTimer.calledWith(42)).to.equal(true)
    expect(log.calledWith('connection established with')).to.equal(true)
  })

  it('disconnects and rejects a connection error', async () => {
    const harness = createHarness()
    const expected = new Error('remote failed')
    const pending = harness.connection.connect()
    harness.connected(expected)

    let actual
    try {
      await pending
    } catch (error) {
      actual = error
    }
    expect(actual).to.equal(expected)
    expect(harness.remote.disconnect.calledOnce).to.equal(true)
  })

  it('disconnects and rejects when the connection times out', async () => {
    const harness = createHarness()
    const pending = harness.connection.connect({ timeout: 7 })
    harness.timeout()

    let actual
    try {
      await pending
    } catch (error) {
      actual = error
    }
    expect(actual.error).to.equal('errors.notConnected')
    expect(actual.reason).to.equal('remote.timeOut')
    expect(actual.details).to.deep.equal({
      contentUrl: settings.remotes.content.url,
      timeout: 7,
    })
    expect(harness.remote.disconnect.calledOnce).to.equal(true)
  })

  it('calls getAll with a scoped token', async () => {
    const harness = createHarness()
    const pendingConnect = harness.connection.connect()
    harness.connected()
    await pendingConnect
    harness.remote.call.callsFake((name, params, callback) => {
      callback(null, { pages: [{ _id: 'one' }] })
    })

    const result = await harness.connection.get({ name: 'pages' })

    expect(result).to.deep.equal({ pages: [{ _id: 'one' }] })
    expect(harness.remote.call.firstCall.args.slice(0, 2)).to.deep.equal([
      'pages.methods.getAll',
      { token: 'token:pages.methods.getAll' },
    ])
  })

  it('calls get with ids and resolves remote errors to an empty result', async () => {
    const harness = createHarness()
    const pendingConnect = harness.connection.connect()
    harness.connected()
    await pendingConnect
    const log = sinon.spy()
    harness.remote.call.callsFake((name, params, callback) => {
      callback(new Error('unavailable'))
    })

    const result = await harness.connection.get({
      name: 'pages',
      ids: ['one', 'two'],
      log,
    })

    expect(result).to.deep.equal([])
    expect(harness.remote.call.firstCall.args.slice(0, 2)).to.deep.equal([
      'pages.methods.get',
      { token: 'token:pages.methods.get', ids: ['one', 'two'] },
    ])
    expect(log.calledWith('unavailable')).to.equal(true)
  })
})
