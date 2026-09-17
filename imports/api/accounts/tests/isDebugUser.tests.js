/* eslint-env mocha */
import { Meteor } from 'meteor/meteor'
import { expect } from 'chai'
import { isDebugUser } from '../isDebugUser'
import { overrideStub, restoreAll, stub } from '../../../../tests/helpers.tests'

describe(isDebugUser.name, () => {
  afterEach(() => {
    restoreAll()
  })

  it('returns the debug status of the user', async () => {
    stub(Meteor, 'userAsync', async () => {})
    expect(await isDebugUser()).to.equal(false)
    overrideStub(Meteor, 'userAsync', async () => ({}))
    expect(await isDebugUser()).to.equal(false)
    overrideStub(Meteor, 'userAsync', async () => ({ debug: false }))
    expect(await isDebugUser()).to.equal(false)
    overrideStub(Meteor, 'userAsync', async () => ({ debug: true }))
    expect(await isDebugUser()).to.equal(true)
  })
  it('updates the current user values when value is passed', async () => {
    let called = false
    stub(Meteor, 'userAsync', async () => ({ debug: false }))
    stub(Meteor, 'call', (name, val, cb) => {
      called = true
      cb()
    })

    expect(await isDebugUser()).to.equal(false)
    expect(await isDebugUser(true, () => {})).to.equal(true)
    expect(called).to.equal(true)
  })
  it('sticks to the old value if an error occurred', async () => {
    let called = false

    stub(Meteor, 'userAsync', async () => ({ debug: false }))
    stub(Meteor, 'call', (name, val, cb) => {
      called = true
      cb(new Error())
    })

    expect(await isDebugUser(true), () => {}).to.equal(false)
    expect(called).to.equal(true)
  })
})
