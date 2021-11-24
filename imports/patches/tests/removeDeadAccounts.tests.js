/* eslint-env mocha */
import { Random } from 'meteor/random'
import { expect } from 'chai'
import { Session } from '../../contexts/session/Session'
import { Response } from '../../contexts/response/Response'
import { Meteor } from 'meteor/meteor'
import { restoreAll, stub } from '../../../tests/helpers.tests'
import { removeDeadAccounts } from '../removeDeadAccounts'
import { mockCollection } from '../../../tests/mockCollection'


mockCollection(Session)
mockCollection(Response)

describe(removeDeadAccounts.name, function () {
  afterEach(function () {
    restoreAll()
  })
  it('throws if the days is not a valid integer', function () {
    [1.1, -1, '1'].forEach(removeOlderThanDays => {
      expect(() => removeDeadAccounts({ removeOlderThanDays  }))
        .to.throw('Match error: Failed Match.Where validation')
    })
  })
  it('removes no users when there are no users older than x days', function () {
    const emptyCursor = Meteor.users.find({ _id: 'impossible' })
    stub(Meteor.users, 'find', () => emptyCursor)
    expect(removeDeadAccounts({ removeOlderThanDays: 1 })).to.deep.equal({
      usersRemoved: 0,
      sessionsRemoved: 0,
      responsesRemoved: 0
    })
  })
  it('removes users that are older than x days and have no completed session', function () {
    const users = [
      { _id: Random.id() },
      { _id: Random.id() },
      { _id: Random.id() }
    ]

    let sessionsRemovedCalled = false
    let usersRemovedCalled = false

    stub(Meteor.users, 'find', () => users)
    stub(Meteor.users, 'remove', ({ _id }) => {
      expect(_id.$in).to.deep.equal([users[0]._id, users[2]._id])
      usersRemovedCalled = true
      return 2
    })
    stub(Session, 'collection', () => ({
      find ({ userId, completedAt }) {
        expect(completedAt).to.equal(undefined)

        return (userId === users[1]._id)
          ? { count: () => 1 }
          : { count: () => 0 }
      },
      remove ({ userId }) {
        expect(userId.$in).to.deep.equal([users[0]._id, users[2]._id])
        sessionsRemovedCalled = true
        return 2
      }
    }))
    stub(Response, 'collection', () => ({
      remove () {
        return 1
      }
    }))

    const { sessionsRemoved, responsesRemoved, usersRemoved } = removeDeadAccounts({ removeOlderThanDays: 1 })
    expect(sessionsRemoved).to.equal(2)
    expect(responsesRemoved).to.equal(1)
    expect(usersRemoved).to.equal(2)
    expect(usersRemovedCalled).to.equal(true)
    expect(sessionsRemovedCalled).to.equal(true)
  })
  it('optionally removes dead accounts with started but not completed session', function () {
    const users = [{ _id: Random.id() }]
    let findCalled = false


    stub(Meteor.users, 'find', () => users)
    stub(Session, 'collection', () => ({
      find ({ userId, completedAt }) {
        expect(completedAt.$exists).to.equal(true)
        findCalled = true
        return { count: () => 1 }
      }
    }))

    removeDeadAccounts({ removeOlderThanDays: 1, removeIncompleteSessions: true })
    expect(findCalled).to.equal(true)
  })
  it('does not do any db writes in dry-run', function () {
    const users = [
      { _id: Random.id() },
      { _id: Random.id() },
      { _id: Random.id() }
    ]

    let sessionsRemovedCalled = false
    let usersRemovedCalled = false

    stub(Meteor.users, 'find', () => users)
    stub(Meteor.users, 'remove', ({ _id }) => {
      expect(_id.$in).to.deep.equal([users[0]._id, users[2]._id])
      usersRemovedCalled = true
      return 2
    })
    stub(Session, 'collection', () => ({
      find ({ userId, completedAt }) {
        expect(completedAt).to.equal(undefined)

        return (userId === users[1]._id)
          ? { count: () => 1 }
          : { count: () => 0 }
      },
      remove ({ userId }) {
        expect(userId.$in).to.deep.equal([users[0]._id, users[2]._id])
        sessionsRemovedCalled = true
        return 2
      }
    }))
    stub(Response, 'collection', () => ({
      remove () {
        return 1
      }
    }))

    const dryRun = true
    const { sessionsRemoved, responsesRemoved, usersRemoved } = removeDeadAccounts({ dryRun, removeOlderThanDays: 1 })
    expect(sessionsRemoved).to.equal(0)
    expect(responsesRemoved).to.equal(0)
    expect(usersRemoved).to.equal(0)
    expect(usersRemovedCalled).to.equal(false)
    expect(sessionsRemovedCalled).to.equal(false)
  })
})
