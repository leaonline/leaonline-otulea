/* eslint-env mocha */
import { expect } from 'chai'
import { Random } from 'meteor/random'
import { sessionIsCancelled } from '../utils/sessionIsCancelled'

describe(sessionIsCancelled.name, function () {
  it('returns, whether the session is cancelled or not', function () {
    expect(sessionIsCancelled({})).to.equal(false)
    expect(sessionIsCancelled({ cancelledAt: null })).to.equal(false)
    expect(sessionIsCancelled({ cancelledAt: Random.id() })).to.equal(false)
    expect(sessionIsCancelled({ cancelledAt: new Date() })).to.equal(true)
  })
})
