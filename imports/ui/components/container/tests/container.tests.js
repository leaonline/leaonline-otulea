/* eslint-env mocha */
/* global $ */
import { expect } from 'chai'
import { UITests } from '../../../../../tests/ui-helpers.tests'
import '../container'

describe('container', function () {
  beforeEach(function () {
    UITests.preRender()
  })

  afterEach(function () {
    UITests.postRender()
  })

  it('is initially not displayed after being rendered', async function () {
    this.timeout(3000)

    const root = await UITests.withRenderedTemplate('container', {})
    const container = $(root.firstChild)

    expect(container.hasClass('lea-base-container')).to.equal(true)
    expect(container.data('visible')).to.equal(false)

    let opacity = Number(container.css('opacity')).toFixed(1)
    expect(opacity).to.equal('0.0')

    await UITests.wait(1000)

    expect(container.data('visible')).to.equal(true)

    opacity = Number(container.css('opacity')).toFixed(1)
    expect(opacity).to.equal('1.0')
  })
})
