/* eslint-env mocha */
import { expect } from 'chai'
import { Mongo } from 'meteor/mongo'
import { Random } from 'meteor/random'
import sinon from 'sinon'
import { ContentServerError, createContentServer } from '../ContentServer'

const getError = async (callback) => {
  try {
    await callback()
  } catch (error) {
    return error
  }
  expect.fail('expected callback to throw')
}

describe('ContentServer', () => {
  let collection
  let connection
  let invocation
  let contentServer
  const context = { name: 'content-server-test' }

  beforeEach(async () => {
    collection = new Mongo.Collection(`content_server_${Random.id()}`)
    await collection.removeAsync({})
    invocation = null
    connection = {
      connect: sinon.stub().resolves(),
      isConnected: sinon.stub().returns(true),
      get: sinon.stub(),
    }
    contentServer = createContentServer({
      connection,
      getCollection: (name) => (name === context.name ? collection : undefined),
      getInvocation: () => invocation,
    })
    contentServer.registerForSync(context)
  })

  afterEach(async () => {
    await collection.removeAsync({})
  })

  it('registers contexts once', () => {
    expect(contentServer.contexts()).to.deep.equal([context])
    expect(() => contentServer.registerForSync(context)).to.throw(
      'already registered',
    )
  })

  it('reports init errors without rejecting startup', async () => {
    const expected = new Error('offline')
    const reportError = sinon.spy()
    const server = createContentServer({
      connection: {
        connect: sinon.stub().rejects(expected),
        isConnected: () => false,
      },
      reportError,
    })

    expect(await server.init()).to.equal(server)
    expect(reportError.calledWith(expected)).to.equal(true)
  })

  it('guards disconnected, invocation, unknown context and collection states', async () => {
    connection.isConnected.returns(false)
    let error = await getError(() => contentServer.sync({ name: context.name }))
    expect(error).to.be.instanceOf(ContentServerError)
    expect(error.reason).to.equal('notConnected')

    connection.isConnected.returns(true)
    invocation = { userId: 'inside-method' }
    error = await getError(() => contentServer.sync({ name: context.name }))
    expect(error.reason).to.equal('methodOrPubInvocation')

    invocation = null
    error = await getError(() => contentServer.sync({ name: 'unknown' }))
    expect(error.reason).to.equal('contextNotDefined')

    const noCollection = createContentServer({
      connection,
      getCollection: () => undefined,
      getInvocation: () => null,
    })
    noCollection.registerForSync(context)
    error = await getError(() => noCollection.sync({ name: context.name }))
    expect(error.reason).to.equal('collectionNotFound')
  })

  it('inserts, updates and destructively removes stale documents', async () => {
    await collection.insertAsync({ _id: 'update', value: 'old', keep: true })
    await collection.insertAsync({ _id: 'remove', value: 'stale' })
    connection.get.resolves({
      [context.name]: [
        { _id: 'insert', value: 'new' },
        { _id: 'update', value: 'fresh' },
      ],
    })

    const stats = await contentServer.sync({
      name: context.name,
      sync: { query: { active: true } },
      debug: true,
    })

    expect(stats).to.deep.equal({
      name: context.name,
      created: 1,
      updated: 1,
      removed: 1,
      skipped: 0,
    })
    expect(await collection.findOneAsync('insert')).to.include({ value: 'new' })
    expect(await collection.findOneAsync('update')).to.include({
      value: 'fresh',
      keep: true,
    })
    expect(await collection.findOneAsync('remove')).to.equal(undefined)
    expect(connection.get.firstCall.args[0].query).to.deep.equal({
      active: true,
    })
  })

  it('keeps local documents for empty and malformed remote results', async () => {
    await collection.insertAsync({ _id: 'safe', value: 'local' })
    for (const result of [
      undefined,
      {},
      { [context.name]: [] },
      { [context.name]: [null] },
      { [context.name]: [{ value: 'missing id' }] },
    ]) {
      connection.get.resolves(result)
      const stats = await contentServer.sync({ name: context.name })
      expect(stats.removed).to.equal(0)
      expect(await collection.findOneAsync('safe')).to.include({
        value: 'local',
      })
    }
  })

  it('runs hooks sequentially in registration order and can unregister them', async () => {
    connection.get.resolves({
      [context.name]: [{ _id: 'insert', value: 'new' }],
    })
    const calls = []
    const first = async ({ type }) => {
      calls.push(`first:${type}:start`)
      await Promise.resolve()
      calls.push(`first:${type}:end`)
    }
    const removed = () => calls.push('removed')
    contentServer.on(contentServer.hooks.beforeSyncUpsert, context.name, first)
    contentServer.on(
      contentServer.hooks.beforeSyncUpsert,
      context.name,
      removed,
    )
    contentServer.off(
      contentServer.hooks.beforeSyncUpsert,
      context.name,
      removed,
    )
    contentServer.on(contentServer.hooks.syncEnd, context.name, () => {
      calls.push('end')
    })

    await contentServer.sync({ name: context.name })

    expect(calls).to.deep.equal([
      'first:insert:start',
      'first:insert:end',
      'end',
    ])
  })
})
