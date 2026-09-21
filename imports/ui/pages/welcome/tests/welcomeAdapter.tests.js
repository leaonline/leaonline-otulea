/* eslint-env mocha */
import { expect } from 'chai'
import sinon from 'sinon'
import { createWelcomeAuthController } from '../welcome'

describe('welcome Blaze adapter', () => {
  it('wires registration through login, device notification and navigation', () => {
    let methodOptions
    const values = new Map()
    const next = sinon.spy()
    const removeStoredCode = sinon.spy()
    const notifyLoggedIn = sinon.spy()
    const loginWithPassword = sinon.spy((_code, _password, callback) =>
      callback(),
    )
    const templateInstance = {
      data: { next },
      state: {
        get: (key) => values.get(key),
        set: (key, value) => values.set(key, value),
      },
    }
    const controller = createWelcomeAuthController(templateInstance, {
      callMethod: (options) => {
        methodOptions = options
      },
      loginWithPassword,
      removeStoredCode,
      notifyLoggedIn,
      transition: (onComplete) => onComplete(),
    })

    expect(
      controller.register({
        code: 'TST42',
        registerCode: 'TST42',
        isDemoUser: true,
      }),
    ).to.equal(true)
    expect(methodOptions.name.name).to.equal('users.methods.register')
    expect(methodOptions.args).to.deep.equal({
      code: 'TST42',
      isDemoUser: true,
    })

    methodOptions.prepare()
    expect(values.get('loggingIn')).to.equal(true)
    methodOptions.success()

    expect(loginWithPassword.calledOnceWith('TST42', 'TST42')).to.equal(true)
    expect(removeStoredCode.calledOnce).to.equal(true)
    expect(notifyLoggedIn.calledOnce).to.equal(true)
    expect(next.calledOnceWithExactly()).to.equal(true)
  })
})
