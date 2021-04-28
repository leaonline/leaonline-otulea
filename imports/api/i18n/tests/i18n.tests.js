/* eslint-env mocha */
import { expect } from 'chai'
import { Random } from 'meteor/random'
import { translate } from '../translate'

describe(translate.name, function () {
  it('returns untranslated if not found', function () {
    const str =  `${Random.id()}.${Random.id()}`
    expect(translate(str)).to.equal(str)
  })
})
