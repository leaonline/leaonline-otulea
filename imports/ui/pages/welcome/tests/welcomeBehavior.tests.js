/* eslint-env mocha */
import { expect } from 'chai'
import sinon from 'sinon'
import {
  combineLoginCode,
  createWelcomeAuth,
  deleteLoginInput,
  normalizePastedCode,
  updateLoginInput,
} from '../welcomeBehavior'

describe('welcome behavior', () => {
  it('normalizes complete pasted codes and rejects other lengths', () => {
    expect(normalizePastedCode('A B\nC 1', 4)).to.equal('ABC1')
    expect(normalizePastedCode('ABC', 4)).to.equal(undefined)
    expect(normalizePastedCode(undefined, 4)).to.equal(undefined)
  })

  it('moves through accepted input and exposes completion', () => {
    const first = updateLoginInput({
      values: ['', '', ''],
      index: 0,
      key: 'A',
    })
    expect(first).to.deep.equal({
      accepted: true,
      values: ['A', '', ''],
      focusIndex: 1,
      complete: false,
    })

    const last = updateLoginInput({
      values: ['A', 'B', ''],
      index: 2,
      key: '1',
    })
    expect(last.values).to.deep.equal(['A', 'B', '1'])
    expect(last.complete).to.equal(true)
    expect(last.focusIndex).to.equal(undefined)
    expect(combineLoginCode(last.values)).to.equal('AB1')
  })

  it('clears whitespace and rejects unsupported characters', () => {
    expect(
      updateLoginInput({ values: ['A'], index: 0, key: ' ' }),
    ).to.deep.equal({
      accepted: true,
      values: [''],
      focusIndex: 0,
      complete: false,
    })
    expect(updateLoginInput({ values: ['A'], index: 0, key: '+' })).to.include({
      accepted: false,
      focusIndex: 0,
      complete: false,
    })
  })

  it('deletes the current value or moves back from an empty field', () => {
    expect(deleteLoginInput({ values: ['A', 'B'], index: 1 })).to.deep.equal({
      values: ['A', ''],
      focusIndex: 1,
    })
    expect(deleteLoginInput({ values: ['A', ''], index: 1 })).to.deep.equal({
      values: ['', ''],
      focusIndex: 0,
    })
  })

  it('rejects mismatched registration codes without a server mutation', () => {
    const callMethod = sinon.spy()
    const onFailure = sinon.spy()
    const auth = createWelcomeAuth({
      callMethod,
      loginWithPassword: sinon.spy(),
      registerMethod: 'users.register',
      onFailure,
      onLoginSuccess: sinon.spy(),
    })

    expect(
      auth.register({ code: 'ABCD', registerCode: 'OTHER', isDemoUser: true }),
    ).to.equal(false)
    expect(onFailure.calledOnceWithExactly()).to.equal(true)
    expect(callMethod.called).to.equal(false)
  })

  it('registers metadata and logs in only after registration succeeds', () => {
    let methodOptions
    const loginWithPassword = sinon.spy((code, password, callback) =>
      callback(),
    )
    const onLoginSuccess = sinon.spy()
    const auth = createWelcomeAuth({
      callMethod: (options) => {
        methodOptions = options
      },
      loginWithPassword,
      registerMethod: 'users.register',
      onFailure: sinon.spy(),
      onLoginSuccess,
    })

    expect(
      auth.register({ code: 'ABCD', registerCode: 'ABCD', isDemoUser: true }),
    ).to.equal(true)
    expect(methodOptions.name).to.equal('users.register')
    expect(methodOptions.args).to.deep.equal({ code: 'ABCD', isDemoUser: true })
    expect(loginWithPassword.called).to.equal(false)
    methodOptions.success()
    expect(loginWithPassword.calledWith('ABCD', 'ABCD')).to.equal(true)
    expect(onLoginSuccess.calledOnce).to.equal(true)
  })

  it('routes registration and login errors through one failure boundary', () => {
    const expected = new Error('login failed')
    const onFailure = sinon.spy()
    let methodOptions
    const auth = createWelcomeAuth({
      callMethod: (options) => {
        methodOptions = options
      },
      loginWithPassword: (code, password, callback) => callback(expected),
      registerMethod: 'users.register',
      onFailure,
      onLoginSuccess: sinon.spy(),
    })

    auth.login('ABCD')
    expect(onFailure.calledWith(expected)).to.equal(true)
    onFailure.resetHistory()
    auth.register({ code: 'ABCD', registerCode: 'ABCD', isDemoUser: false })
    methodOptions.failure(expected)
    expect(onFailure.calledWith(expected)).to.equal(true)
  })
})
