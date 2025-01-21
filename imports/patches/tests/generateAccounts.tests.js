/* eslint-env mocha */
import { Meteor } from 'meteor/meteor'
import { Random } from 'meteor/random'
import { expect } from 'chai'
import { generateAccounts } from '../generateAccounts'
import { mockCollection } from '../../../tests/mockCollection'
import { Users } from '../../contexts/user/User'

mockCollection(Users)

describe(generateAccounts.name, function () {
  beforeEach(async function () {
    await Users.collection().removeAsync()
  })
  it('generates x users by given amount with random codes', async function () {
    const comment = Random.id()
    const result = await generateAccounts({
      amount: 5,
      dryRun: false,
      isDemo: true,
      comment: comment
    })
    const { users, ...rest } = result
    expect(rest).to.deep.equal({
      amount: 5,
      created: 5,
      dryRun: false,
      comment: comment,
      isDemo: true,
      updated: 5
    })

    expect(users.length).to.equal(5)

    for (const user of users) {
      const userDoc = await Meteor.users.findOneAsync({ _id: user.userId })
      expect(userDoc.isDemo).to.equal(true)
      expect(userDoc.comment).to.equal(comment)
    }
  })
  it('does no db writes if dry-run is active', async function () {
    const comment = Random.id()
    const result = await generateAccounts({
      amount: 5,
      dryRun: true,
      isDemo: false,
      comment: comment
    })
    const { users, ...rest } = result
    expect(rest).to.deep.equal({
      amount: 5,
      created: 0,
      dryRun: true,
      comment: comment,
      isDemo: false,
      updated: 0
    })

    for (const user of users) {
      const userDoc = await Meteor.users.findOneAsync({ _id: user.userId })
      expect(userDoc).to.equal(undefined)
    }
  })
})
