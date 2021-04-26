/* eslint-env mocha */
import { Meteor } from 'meteor/meteor'
import { Random } from 'meteor/random'
import { expect } from 'chai'
import { restoreAll, stub } from '../helpers.tests'

describe('client test', function () {
  let userId
  beforeEach(function () {
    userId = Random.id()
    stub(Meteor, 'userId', () => userId)
  })
  afterEach(function () {
    restoreAll()
  })

  it('stubs a user', function () {
    expect(Meteor.userId()).to.not.equal(undefined)
    expect(Meteor.userId()).to.equal(userId)
  })
})
