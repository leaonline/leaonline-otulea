/* eslint-env mocha */
/* global $ */
import { expect } from 'chai'
import sinon from 'sinon'
import { UITests } from '../../../../../tests/ui-helpers.tests'
import { createContainerOnRendered } from '../container'

describe('container', () => {
  beforeEach(() => {
    UITests.preRender()
    $.fx.off = true
  })

  afterEach(() => {
    UITests.postRender()
    $.fx.off = false
  })

  it('marks itself visible after rendering without a real animation wait', async () => {
    const root = await UITests.withRenderedTemplate('container', {})
    const container = $(root.firstChild)

    expect(container.hasClass('lea-base-container')).to.equal(true)
    expect(container.data('visible')).to.equal(true)
  })

  it('exposes an injected animation boundary and reports animation errors', () => {
    const expected = new Error('animation failed')
    const reportError = sinon.spy()
    const animate = sinon.spy((selector, instance, callback) =>
      callback(expected),
    )
    const instance = {}

    createContainerOnRendered({ animate, reportError }).call(instance)

    expect(animate.firstCall.args.slice(0, 2)).to.deep.equal([
      '.lea-base-container',
      instance,
    ])
    expect(reportError.calledWith(expected)).to.equal(true)
  })
})
