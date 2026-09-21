/* eslint-env mocha */
import { expect } from 'chai'
import crypto from 'crypto'
import { createFixedHMAC } from './createFixedHMAC'

describe('createFixedHMAC', () => {
  it('returns one fixed digest and rejects updates after finalization', () => {
    const expected = crypto
      .createHmac('sha256', 'secret')
      .update('first')
      .digest('hex')
    const digest = createFixedHMAC('secret', 'hex')

    expect(digest('first')).to.equal(expected)
    expect(() => digest('ignored')).to.throw('Digest already called')
  })
})
