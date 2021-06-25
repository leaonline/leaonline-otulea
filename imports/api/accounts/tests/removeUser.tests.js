/* eslint-env mocha */
import { Meteor } from 'meteor/meteor'
import { expect } from 'chai'
import { Random } from 'meteor/random'
import { removeUser } from '../removeUser'
import {
  mockCollection,
  restoreCollection
} from '../../../../tests/mockCollection'
import { Session } from '../../../contexts/session/Session'
import { Response } from '../../../contexts/response/Response'
import { Feedback } from '../../../contexts/feedback/Feedback'
import { stub, restoreAll } from '../../../../tests/helpers.tests'

describe(removeUser.name, function () {
  beforeEach(function () {
    mockCollection(Session)
    mockCollection(Response)
    mockCollection(Feedback)
  })
  afterEach(function () {
    restoreCollection(Session)
    restoreCollection(Response)
    restoreCollection(Feedback)
    restoreAll()
  })

  it('throws if the given user is not found', function () {
    expect(() => removeUser()).to.throw('removeUser.userDoesNotExist')
    expect(() => removeUser(Random.id())).to.throw('removeUser.userDoesNotExist')
  })
  it('returns the amount of documents removed for the user', function () {
    const sessionsRemoved = Math.floor(Math.random() * 100)
    const responsesRemoved = Math.floor(Math.random() * 100)
    const feedbackRemoved = Math.floor(Math.random() * 100)
    const userRemoved = 1
    stub(Session, 'collection', () => ({ remove: () => sessionsRemoved }))
    stub(Response, 'collection', () => ({ remove: () => responsesRemoved }))
    stub(Feedback, 'collection', () => ({ remove: () => feedbackRemoved }))
    stub(Meteor.users, 'remove', () => userRemoved)
    stub(Meteor.users, 'findOne', () => ({ _id: Random.id() }))

    expect(removeUser()).to.deep.equal({
      sessionsRemoved, responsesRemoved, userRemoved, feedbackRemoved
    })
  })
  it('allows to pass a debug log', function (done) {
    const userId = Random.id()
    const calledBy = Random.id()
    const log = (...args) => {
      expect(args).to.deep.equal([
        removeUser.name,
        { userId, calledBy }
      ])
      done()
    }
    expect(() => removeUser(userId, calledBy, log)).to.throw('removeUser.userDoesNotExist')
  })
})
