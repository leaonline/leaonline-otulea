/* eslint-env mocha */
import { expect } from 'chai'
import { Meteor } from 'meteor/meteor'
import { Random } from 'meteor/random'
import sinon from 'sinon'
import { createPublication, createPublications } from './createPublication'

const environment = () => ({
  userId: null,
  ready: sinon.spy(() => 'ready'),
  error: sinon.spy((error) => error),
})

describe('createPublications', () => {
  it('registers definitions and completes an empty publication', async () => {
    const name = `__tests__.publications.${Random.id()}`
    createPublications([
      {
        name,
        schema: { value: String },
        isPublic: true,
        run: () => undefined,
      },
    ])
    const handler = Meteor.server.publish_handlers[name]
    const invocation = environment()

    expect(handler).to.be.a('function')
    expect(await handler.call(invocation, { value: 'ok' })).to.equal('ready')
    expect(invocation.ready.calledOnce).to.equal(true)
    expect(invocation.error.called).to.equal(false)
  })

  it('routes schema failures through the publication error boundary', async () => {
    const name = `__tests__.publications.${Random.id()}`
    const run = sinon.spy()
    createPublication({
      name,
      schema: { value: String },
      isPublic: true,
      run,
    })
    const invocation = environment()

    await Meteor.server.publish_handlers[name].call(invocation, { value: 9 })

    expect(run.called).to.equal(false)
    expect(invocation.error.calledOnce).to.equal(true)
  })

  it('rejects protected publications before behavior runs', async () => {
    const name = `__tests__.publications.${Random.id()}`
    const run = sinon.spy()
    createPublication({ name, schema: {}, run })
    const invocation = environment()

    await Meteor.server.publish_handlers[name].call(invocation, {})

    expect(run.called).to.equal(false)
    expect(invocation.error.calledOnce).to.equal(true)
    expect(invocation.error.firstCall.args[0].error).to.equal(
      'errors.permissionDenied',
    )
  })
})
