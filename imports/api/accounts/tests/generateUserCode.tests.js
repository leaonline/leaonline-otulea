/* eslint-env mocha */
import { expect } from 'chai'
import { generateUserCode } from '../generateUserCode'

describe(generateUserCode.name, function () {
  it('generates a random code of given length', function () {
    for (let i = 0; i < 1000; i++) {
      expect(generateUserCode().length).to.equal(5)
    }
  })
  it('returns undefined if no code has been generated in given retries', function () {
    let foundNone = false
    for (let i = 0; i < 1000; i++) {
      const code = generateUserCode(128, 1)
      if (code === undefined) foundNone = true
    }

    expect(foundNone).to.equal(true)
  })
})
