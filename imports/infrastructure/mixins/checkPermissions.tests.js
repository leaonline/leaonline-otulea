/* eslint-env mocha */
import { Meteor } from 'meteor/meteor'
import { Random } from 'meteor/random'
import { expect } from 'chai'
import { checkPermissions } from './checkPermissions'
import { stub, restoreAll, expectThrow } from '../../../tests/helpers.tests'
describe(checkPermissions.name, () => {
  afterEach(() => {
    restoreAll()
  })

  it('skips if isPublic flag is set', async () => {
    const value = Random.id()
    const options = {
      isPublic: true,
      run: async () => value,
    }

    const updatedOptions = checkPermissions(options)
    expect(await updatedOptions.run()).to.equal(value)
  })
  it('runs the function if there is a user', async () => {
    const value = Random.id()
    const options = {
      run: async () => value,
    }

    const updatedOptions = checkPermissions(options)
    expect(await updatedOptions.run.call({ userId: Random.id() })).to.equal(
      value,
    )
  })
  it('throws if there is no logged in user', async () => {
    const options = {
      run: async () => {
        throw new Error('unexpected call')
      },
    }

    const updatedOptions = checkPermissions(options)
    await expectThrow({
      fn: () => updatedOptions.run(),
      message: 'errors.userNotExists',
    })
  })
  it('throws if the method is backend-flagged but the user is no backend-user', async () => {
    const user = { _id: Random.id(), username: Random.id() }
    const userStub = stub(Meteor.users, 'findOneAsync', async () => user)
    const value = Random.id()
    const options = {
      backend: true,
      run: async () => value,
    }

    const updatedOptions = checkPermissions(options)
    await expectThrow({
      fn: () => updatedOptions.run.call({ userId: user._id }),
      message: 'errors.backendOnly',
    })
    expect(userStub.calledOnce).to.equal(true)
  })
  it('passes if the method is backend-flagged and the user is a backend user', async () => {
    const user = {
      _id: Random.id(),
      username: Random.id(),
      services: { lea: {} },
    }
    const userStub = stub(Meteor.users, 'findOneAsync', async () => user)

    const value = Random.id()
    const options = {
      backend: true,
      run: async () => value,
    }

    const updatedOptions = checkPermissions(options)
    expect(await updatedOptions.run.call({ userId: user._id })).to.equal(value)
    expect(userStub.calledOnce).to.equal(true)
  })
})
