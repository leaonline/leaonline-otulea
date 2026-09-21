/* eslint-env mocha */
import { expect } from 'chai'
import sinon from 'sinon'
import { callMethod } from './callMethod'

describe('callMethod', () => {
  it('runs prepare, receive and success in order', async () => {
    const calls = []
    const connection = {
      call(name, args, callback) {
        calls.push(['call', name, args])
        callback(null, 'result')
      },
    }

    const result = await callMethod({
      name: { name: 'test.method' },
      args: { value: 1 },
      connection,
      prepare: () => calls.push('prepare'),
      receive: () => calls.push('receive'),
      success: (value) => calls.push(`success:${value}`),
    })

    expect(result).to.equal('result')
    expect(calls).to.deep.equal([
      'prepare',
      ['call', 'test.method', { value: 1 }],
      'receive',
      'success:result',
    ])
  })

  it('runs receive, reports and exposes a rejection before failure', async () => {
    const expected = new Error('rejected')
    const calls = []
    const reportError = sinon.spy(() => calls.push('report'))
    const connection = {
      call(name, args, callback) {
        callback(expected)
      },
    }

    let actual
    try {
      await callMethod({
        name: 'test.method',
        args: undefined,
        connection,
        receive: () => calls.push('receive'),
        failure: (error) => calls.push(`failure:${error.message}`),
        reportError,
      })
    } catch (error) {
      actual = error
    }
    await Promise.resolve()

    expect(actual).to.equal(expected)
    expect(calls).to.deep.equal(['receive', 'report', 'failure:rejected'])
    expect(reportError.firstCall.args[0]).to.deep.equal({
      error: expected,
      isResponse: true,
    })
  })

  it('rejects invalid method definitions before calling the transport', () => {
    const connection = { call: sinon.spy() }
    expect(() => callMethod({ name: undefined, connection })).to.throw()
    expect(connection.call.called).to.equal(false)
  })
})
