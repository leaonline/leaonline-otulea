/* eslint-env mocha */
import { Random } from 'meteor/random'
import { expect } from 'chai'
import { generateAccounts } from '../generateAccounts'
import { mockCollection } from '../../../tests/mockCollection'
import { Users } from '../../contexts/user/User'

mockCollection(Users)

describe(generateAccounts.name, function () {
  beforeEach(function () {
    Users.collection().remove()
  })
  it('generates x users by given amount with random codes', function (done) {
    const comment = Random.id()
    generateAccounts({
      amount: 5,
      dryRun: false,
      isDemo: true,
      comment: comment
    }, function (result) {
      const { users, ...rest } = result
      expect(rest).to.deep.equal({
        amount: 5,
        created: 5,
        dryRun: false,
        comment: comment,
        isDemo: true,
        updated: 5
      })

      users.forEach(({ userId, code }) => {
        const userDoc = Meteor.users.findOne({ _id: userId, username: code })
        expect(userDoc.isDemo).to.equal(true)
        expect(userDoc.comment).to.equal(comment)
      })

      done()
    })
  })
  it('does no db writes if dry-run is active', function (done) {
    const comment = Random.id()
    generateAccounts({
      amount: 5,
      dryRun: true,
      isDemo: false,
      comment: comment
    }, function (result) {
      const { users, ...rest } = result
      expect(rest).to.deep.equal({
        amount: 5,
        created: 0,
        dryRun: true,
        comment: comment,
        isDemo: false,
        updated: 0
      })

      users.forEach(({ userId, code }) => {
        const userDoc = Meteor.users.findOne({ _id: userId, username: code })
        expect(userDoc).to.equal(undefined)
      })

      done()
    })
  })
})
