/* eslint-env mocha */
import { expect } from 'chai'
import { Accounts } from 'meteor/accounts-base'
import { Meteor } from 'meteor/meteor'
import { Random } from 'meteor/random'
import sinon from 'sinon'
import { createMethod } from '../../../infrastructure/factories/method/createMethods'
import { Users } from '../User'

const methodNames = {
  isDebug: '__tests__.users.methods.isDebug',
  register: '__tests__.users.methods.register',
}

createMethod({ ...Users.methods.isDebug, name: methodNames.isDebug })
createMethod({ ...Users.methods.register, name: methodNames.register })

let codeCounter = 0
const nextCode = () => `U${String(++codeCounter).padStart(4, '0')}`

const invoke = (name, context, args) =>
  Meteor.server.method_handlers[name].apply(context, [args])

const rejected = async (callback) => {
  try {
    await callback()
  } catch (error) {
    return error
  }
  expect.fail('expected callback to reject')
}

describe('Users method definitions', () => {
  const createdIds = new Set()

  afterEach(async () => {
    sinon.restore()
    if (createdIds.size > 0) {
      await Meteor.users.removeAsync({ _id: { $in: Array.from(createdIds) } })
      createdIds.clear()
    }
  })

  it('rejects an unauthenticated registered mutation without changing users', async () => {
    const before = await Meteor.users.countDocuments({})
    const error = await rejected(() =>
      invoke(methodNames.isDebug, { userId: null }, { value: true }),
    )

    expect(error.error).to.equal('errors.permissionDenied')
    expect(await Meteor.users.countDocuments({})).to.equal(before)
  })

  it('validates registered method arguments before mutation', async () => {
    const userId = await Accounts.createUserAsync({
      username: nextCode(),
      password: 'test-password',
    })
    createdIds.add(userId)

    await rejected(() =>
      invoke(methodNames.isDebug, { userId }, { value: 'not-a-boolean' }),
    )

    expect((await Meteor.users.findOneAsync(userId)).debug).to.equal(undefined)
  })

  it('updates debug state for an authenticated registered handler', async () => {
    const userId = await Accounts.createUserAsync({
      username: nextCode(),
      password: 'test-password',
    })
    createdIds.add(userId)

    const updated = await invoke(methodNames.isDebug, { userId }, { value: true })

    expect(updated).to.equal(1)
    expect((await Meteor.users.findOneAsync(userId)).debug).to.equal(true)
  })

  it('registers a demo user and rejects a duplicate code', async () => {
    const code = nextCode()
    const firstId = await invoke(
      methodNames.register,
      { userId: null },
      { code, isDemoUser: true },
    )
    createdIds.add(firstId)

    const error = await rejected(() =>
      invoke(methodNames.register, { userId: null }, { code }),
    )

    expect(error).to.exist
    expect(await Meteor.users.countDocuments({ username: code })).to.equal(1)
    expect((await Meteor.users.findOneAsync(firstId)).isDemoUser).to.equal(true)
  })

  it('refuses to generate a code for an existing session user', async () => {
    const error = await rejected(() =>
      Users.methods.generateCode.run.call({ userId: 'already-logged-in' }),
    )

    expect(error.error).to.equal('generateCode.error')
    expect(error.reason).to.equal('generateCode.alreadyLoggedIn')
  })

  it('propagates code generation exhaustion without creating a user', async function () {
    this.timeout(5000)
    const existingId = await Accounts.createUserAsync({
      username: 'AAAAA',
      password: 'test-password',
    })
    createdIds.add(existingId)
    const before = await Meteor.users.countDocuments({})
    sinon.stub(Random, 'id').returns('AAAAA')

    const error = await rejected(() =>
      Users.methods.generateCode.run.call({ userId: null }),
    )

    expect(error.error).to.equal('generateUserCode.error')
    expect(error.reason).to.equal('generateUserCode.maxTriesExceeded')
    expect(await Meteor.users.countDocuments({})).to.equal(before)
  })

  it('records distinct agent metadata on login', async () => {
    const userId = await Accounts.createUserAsync({
      username: nextCode(),
      password: 'test-password',
    })
    createdIds.add(userId)
    const metadata = {
      screenWidth: 1920,
      screenHeight: 1080,
      viewPortWidth: 1200,
      viewPortHeight: 800,
    }

    await Users.methods.loggedIn.run.call(
      {
        userId,
        connection: {
          clientAddress: '127.0.0.1',
          httpHeaders: { 'user-agent': 'coverage-test-agent' },
        },
      },
      metadata,
    )

    const user = await Meteor.users.findOneAsync(userId)
    expect(user.updatedAt).to.be.instanceOf(Date)
    expect(user.agents).to.have.lengthOf(1)
    expect(user.agents[0]).to.include({
      ...metadata,
      name: 'coverage-test-agent',
    })
    expect(user.agents[0].origin).to.be.a('string').and.not.equal('127.0.0.1')
  })

  it('finds existing users without exposing a mutation', async () => {
    const code = nextCode()
    const userId = await Accounts.createUserAsync({
      username: code,
      password: 'test-password',
    })
    createdIds.add(userId)

    const user = await Users.methods.exist.run({ code })

    expect(user._id).to.equal(userId)
    expect(user.username).to.equal(code)
  })
})
