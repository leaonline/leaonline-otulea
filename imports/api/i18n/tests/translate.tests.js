/* eslint-env mocha */
import { expect } from 'chai'
import { Random } from 'meteor/random'
import { translate } from '../translate'

describe(translate.name, () => {
  it('returns untranslated if not found', () => {
    const str = `${Random.id()}.${Random.id()}`
    expect(translate(str)).to.equal(str)
  })
})
