/* eslint-env mocha */
import { expect } from 'chai'
import SimpleSchema from 'simpl-schema'
import { regExSchema } from '../regExSchema'

describe('regExSchema', () => {
  it('exposes the schema provider regular-expression catalogue', () => {
    expect(regExSchema).to.equal(SimpleSchema.RegEx)
    expect(regExSchema.Email).to.be.instanceOf(RegExp)
  })
})
