/* eslint-env mocha */
import { expect } from 'chai'
import { Random } from 'meteor/random'
import { sessionIsComplete } from '../utils/sessionIsComplete'

describe(sessionIsComplete.name, function () {
  it('returns, whether the session is cancelled or not', function () {
    expect(sessionIsComplete({})).to.equal(false)
    expect(sessionIsComplete({ completedAt: null })).to.equal(false)
    expect(sessionIsComplete({ completedAt: Random.id() })).to.equal(false)
    expect(sessionIsComplete({ completedAt: new Date() })).to.equal(true)
  })
})
