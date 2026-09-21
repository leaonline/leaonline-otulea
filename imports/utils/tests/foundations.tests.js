/* eslint-env mocha */
import { expect } from 'chai'
import sinon from 'sinon'
import { deprecate } from '../deprecate'
import { errorToObject } from '../object/errorToObject'

describe('utility foundations', () => {
  afterEach(() => sinon.restore())

  it('warns and preserves a deprecated function context and return value', () => {
    const warn = sinon.stub(console, 'warn')
    const target = {
      value: 4,
      execute: deprecate(function (increment) {
        return this.value + increment
      }, 'execute'),
    }

    expect(target.execute(3)).to.equal(7)
    expect(warn.calledWith('execute is deprecated')).to.equal(true)
  })

  it('uses a generic warning when no function name is available', () => {
    const warn = sinon.stub(console, 'warn')
    const wrapped = deprecate(() => {})
    wrapped.call(null)
    expect(warn.calledWith('function/method is deprecated')).to.equal(true)
  })

  it('converts non-enumerable Error properties into a plain object', () => {
    const error = new Error('broken')
    error.code = 'E_TEST'
    const result = errorToObject(error)
    expect(result).to.include({ message: 'broken', code: 'E_TEST' })
    expect(result.stack).to.be.a('string')
  })
})
