/* eslint-env mocha */
import { Meteor } from 'meteor/meteor'
import { expect } from 'chai'
import { isDebugUser } from '../isDebugUser'
import { overrideStub, restoreAll, stub } from '../../../../tests/helpers.tests'

describe(isDebugUser.name, function () {
  afterEach(function () {
    restoreAll()
  })

  it('returns the debug status of the user', function () {
    stub(Meteor, 'user', () => {})
    expect(isDebugUser()).to.equal(false)
    overrideStub(Meteor, 'user', () => ({}))
    expect(isDebugUser()).to.equal(false)
    overrideStub(Meteor, 'user', () => ({ debug: false }))
    expect(isDebugUser()).to.equal(false)
    overrideStub(Meteor, 'user', () => ({ debug: true }))
    expect(isDebugUser()).to.equal(true)
  })
  it('updates the current user values when value is passed', function () {
    let called = false
    stub(Meteor, 'user', () => ({ debug: false }))
    stub(Meteor, 'call', (name, val, cb) => {
      called = true
      cb()
    })

    expect(isDebugUser()).to.equal(false)
    expect(isDebugUser(true, () => {})).to.equal(true)
    expect(called).to.equal(true)
  })
  it('sticks to the old value if an error occurred', function () {
    let called = false

    stub(Meteor, 'user', () => ({ debug: false }))
    stub(Meteor, 'call', (name, val, cb) => {
      called = true
      cb(new Error())
    })

    expect(isDebugUser(true), () => {}).to.equal(false)
    expect(called).to.equal(true)
  })
})
