/* eslint-env mocha */
import { expect } from 'chai'
import { Meteor } from 'meteor/meteor'
import { Random } from 'meteor/random'
import sinon from 'sinon'
import { createMethod, createMethods } from './createMethods'

const invoke = (name, context, args) =>
  Meteor.server.method_handlers[name].apply(context, [args])

describe('createMethods', () => {
  it('registers definitions and runs the registered handler', async () => {
    const name = `__tests__.methods.${Random.id()}`
    createMethods([
      {
        name,
        schema: { value: String },
        isPublic: true,
        run: ({ value }) => `received:${value}`,
      },
    ])

    expect(Meteor.server.method_handlers[name]).to.be.a('function')
    expect(await invoke(name, { userId: null }, { value: 'ok' })).to.equal(
      'received:ok',
    )
  })

  it('rejects schema failures before invoking method behavior', async () => {
    const name = `__tests__.methods.${Random.id()}`
    const run = sinon.spy()
    createMethod({
      name,
      schema: { value: String },
      isPublic: true,
      run,
    })

    let error
    try {
      await invoke(name, { userId: null }, { value: 42 })
    } catch (runtimeError) {
      error = runtimeError
    }

    expect(error).to.exist
    expect(run.called).to.equal(false)
  })

  it('keeps the original runtime error after the error mixin observes it', async () => {
    const name = `__tests__.methods.${Random.id()}`
    const expected = new Error('method failed')
    const consoleError = sinon.stub(console, 'error')
    createMethod({
      name,
      schema: {},
      isPublic: true,
      run: () => {
        throw expected
      },
    })

    let actual
    try {
      await invoke(name, { userId: null }, {})
    } catch (error) {
      actual = error
    }

    expect(actual).to.equal(expected)
    expect(consoleError.calledWith(expected)).to.equal(true)
    consoleError.restore()
  })
})
