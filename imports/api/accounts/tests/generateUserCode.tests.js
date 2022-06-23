/* eslint-env mocha */
import { expect } from 'chai'
import { generateUserCode } from '../generateUserCode'

describe(generateUserCode.name, function () {
  it('generates a random code of given length', function () {
    this.timeout(5000)
    for (let i = 0; i < 1000; i++) {
      expect(generateUserCode().length).to.equal(5)
    }
  })
  it('throws an error if no code has been generated in given retries', function () {
    let thrown = false
    for (let i = 0; i < 1000; i++) {
      try {
        generateUserCode(128, 1)
      }
      catch (e) {
        expect(e.reason).to.equal('generateUserCode.maxTriesExceeded')
        thrown = true
      }
    }

    expect(thrown).to.equal(true)
  })
})
