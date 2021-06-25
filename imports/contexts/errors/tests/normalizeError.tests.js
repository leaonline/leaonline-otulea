/* eslint-env mocha */
import { Meteor } from 'meteor/meteor'
import { expect } from 'chai'
import { Random } from 'meteor/random'
import { normalizeError } from '../api/normalizeError'
import { Schema } from '../../../api/schema/Schema'
import { Errors } from '../Errors'

const isHex = str => (/^[a-f0-9]*$/g).test(str)
const errorSchema = Schema.create(Errors.schema)

describe(normalizeError.name, function () {
  it('transforms a meteor error correctly', function () {
    const name = Random.id()
    const reason = Random.id()
    const details = { foo: Random.id() }
    const error = new Meteor.Error(name, reason, details)
    const normalized = normalizeError({ error })
    expect(normalized.name).to.equal(name)
    expect(normalized.type).to.equal(error.errorType)
    expect(normalized.message).to.equal(reason)
    expect(normalized.stack.split(/\n/g).length).to.be.lessThanOrEqual(3)
    expect(normalized.isClient).to.equal(Meteor.isClient)
    expect(normalized.isServer).to.equal(Meteor.isServer)
    expect(normalized.createdAt instanceof Date).to.equal(true)
    expect(normalized.createdBy).to.equal('system')
    expect(normalized.details).to.equal(JSON.stringify(details))
    expect(isHex(normalized.hash)).to.equal(true)
    expect(errorSchema.validate(normalized)).to.equal(undefined)
  })
  it('transforms a native error correctly', function () {
    const reason = Random.id()
    const error = new Error(reason)
    error.details = { foo: Random.id() }

    const normalized = normalizeError({ error })
    expect(normalized.name).to.equal(error.name)
    expect(normalized.type).to.equal('Native.Error')
    expect(normalized.message).to.equal(reason)
    expect(normalized.stack.split(/\n/g).length).to.be.lessThanOrEqual(3)
    expect(normalized.isClient).to.equal(Meteor.isClient)
    expect(normalized.isServer).to.equal(Meteor.isServer)
    expect(normalized.createdAt instanceof Date).to.equal(true)
    expect(normalized.createdBy).to.equal('system')
    expect(normalized.details).to.equal(JSON.stringify(error.details))
    expect(isHex(normalized.hash)).to.equal(true)
    expect(errorSchema.validate(normalized)).to.equal(undefined)
  })

  it('adds additional info', function () {
    const def = {
      error: new Error(),
      browser: { foo: Random.id() },
      userId: Random.id(),
      template: Random.id(),
      method: Random.id(),
      publication: Random.id(),
      endpoint: Random.id(),
      isSystem: true
    }
    const normalized = normalizeError(def)
    expect(normalized.browser).to.equal(Meteor.isClient ? JSON.stringify(def.browser) : undefined)
    expect(normalized.createdBy).to.equal(def.userId)
    expect(normalized.template).to.equal(def.template)
    expect(normalized.method).to.equal(def.method)
    expect(normalized.publication).to.equal(def.publication)
    expect(normalized.endpoint).to.equal(def.endpoint)
    expect(normalized.isSystem).to.equal(true)

    expect(errorSchema.validate(normalized)).to.equal(undefined)
  })
})
