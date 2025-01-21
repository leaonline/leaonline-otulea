/* eslint-env mocha */
import { Meteor } from 'meteor/meteor'
import { expect } from 'chai'
import { Random } from 'meteor/random'
import { removeUser } from '../removeUser'
import {
  clearCollection,
  mockCollection,
  restoreCollection
} from '../../../../tests/mockCollection'
import { Session } from '../../../contexts/session/Session'
import { Response } from '../../../contexts/response/Response'
import { Feedback } from '../../../contexts/feedback/Feedback'
import { stub, restoreAll, expectThrow } from '../../../../tests/helpers.tests'

describe(removeUser.name, function () {
  before(function () {
    mockCollection(Session)
    mockCollection(Response)
    mockCollection(Feedback)
  })
  after(async function () {
    await restoreCollection(Session)
    await restoreCollection(Response)
    await restoreCollection(Feedback)
  })

  afterEach(async function () {
    await restoreAll()
    clearCollection(Session)
    clearCollection(Response)
    clearCollection(Feedback)
  })

  it('throws if the given user is not found', async function () {
    await expectThrow({
      fn: () => removeUser(),
      message: 'removeUser.userDoesNotExist'
    })
    await expectThrow({
      fn: () => removeUser(Random.id()),
      message: 'removeUser.userDoesNotExist'
    })
  })
  it('returns the amount of documents removed for the user', async function () {
    const sessionsRemoved = Math.floor(Math.random() * 100)
    const responsesRemoved = Math.floor(Math.random() * 100)
    const feedbackRemoved = Math.floor(Math.random() * 100)
    const userRemoved = 1
    stub(Session, 'collection', () => ({ removeAsync: async () => sessionsRemoved }))
    stub(Response, 'collection', () => ({ removeAsync: async () => responsesRemoved }))
    stub(Feedback, 'collection', () => ({ removeAsync: async () => feedbackRemoved }))
    stub(Meteor.users, 'removeAsync', async () => userRemoved)
    stub(Meteor.users, 'findOneAsync', async () => ({ _id: Random.id() }))

    expect(await removeUser()).to.deep.equal({
      sessionsRemoved,
      responsesRemoved,
      userRemoved,
      feedbackRemoved
    })
  })
  it('allows to pass a debug log', async function () {
    const userId = Random.id()
    const calledBy = Random.id()
    let called = false
    const log = (...args) => {
      expect(args).to.deep.equal([removeUser.name, { userId, calledBy }])
      called = true
    }
    await expectThrow({
      fn: () => removeUser(userId, calledBy, log),
      message: 'removeUser.userDoesNotExist'
    })
    expect(called).to.equal(true)
  })
})
