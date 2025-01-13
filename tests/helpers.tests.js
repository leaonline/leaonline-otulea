import SimpleSchema from 'simpl-schema'
import sinon from 'sinon'
import { expect } from 'chai'

// allow our custom schema keys here to pass schema based tests
SimpleSchema.extendOptions(['autoform'])

export const createSchema = (schema, options) => new SimpleSchema(schema, options)
export const multiSchema = (...defs) => SimpleSchema.oneOf(defs)

export const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
export const iterate = (num, fct) => (new Array(num)).forEach(fct)

export const unsafeInt = negative => negative
  ? (Number.MIN_SAFE_INTEGER - 1)
  : (Number.MAX_SAFE_INTEGER + 1)

/**
 * expects an async function to throw with given message
 * @param fn
 * @param message
 * @param details
 * @return {Promise<*>}
 */
export const expectThrow = async function ({ fn, message, details }) {
  try {
    await fn()
    expect.fail()
  }
  catch (e) {
    if (message) expect(e.message).to.include(message)
    if (details) expect(e.details).to.deep.equal(details)
    return e
  }
}

// /////////////////////////////////////////////////////////////////////////////
//
// Stubbing, the easy way
//
// /////////////////////////////////////////////////////////////////////////////

const stubs = new Map()

export const stub = (target, name, handler) => {
  if (stubs.get(target)) {
    throw new Error(`already stubbed: ${name}`)
  }
  const stubbedTarget = sinon.stub(target, name)
  if (typeof handler === 'function') {
    stubbedTarget.callsFake(handler)
  }
  else {
    stubbedTarget.value(handler)
  }
  stubs.set(stubbedTarget, name)
}

export const restore = (target, name) => {
  if (!target[name] || !target[name].restore) {
    throw new Error(`not stubbed: ${name}`)
  }
  target[name].restore()
  stubs.delete(target)
}

export const overrideStub = (target, name, handler) => {
  restore(target, name)
  stub(target, name, handler)
}

export const restoreAll = () => {
  stubs.forEach((name, target) => {
    target.restore()
    stubs.delete(target)
  })
}
