/* eslint-env mocha */
import { expect } from 'chai'
import sinon from 'sinon'
import { Env } from './Env'

describe('Env', () => {
  it('reports the configured test environment', () => {
    expect(Env.get()).to.equal('test')
    expect(Env.isDev).to.equal(false)
    expect(Env.isStaging).to.equal(false)
    expect(Env.isProd).to.equal(false)
  })

  it('runs callbacks only for matching scalar or array environments', () => {
    const callback = sinon.spy()
    Env.on('dev', callback)
    Env.on(['staging', 'test'], callback)
    expect(callback.calledOnce).to.equal(true)
  })
})
