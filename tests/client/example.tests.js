/* eslint-env mocha */
import { Meteor } from 'meteor/meteor'
import { Random } from 'meteor/random'
import { expect } from 'chai'
import { restoreAll, stub } from '../helpers.tests'

describe('client test', () => {
  let userId
  beforeEach(() => {
    userId = Random.id()
    stub(Meteor, 'userId', () => userId)
  })
  afterEach(() => {
    restoreAll()
  })

  it('stubs a user', () => {
    expect(Meteor.userId()).to.not.equal(undefined)
    expect(Meteor.userId()).to.equal(userId)
  })
})
