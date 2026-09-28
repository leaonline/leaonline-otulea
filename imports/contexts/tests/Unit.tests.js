/* eslint-env mocha */
import { expect } from 'chai'
import { Unit } from '../Unit'

describe('Unit.getContentElement', () => {
  const first = { type: 'text', contentId: 'first' }
  const requested = { type: 'item', contentId: 'target' }
  const fallback = { type: 'item', contentId: 'fallback' }
  const unit = {
    pages: [
      { content: [first, requested] },
      { content: [] },
      {},
      { content: [fallback] },
    ],
  }

  it('returns null for incomplete units or identifiers', () => {
    expect(Unit.getContentElement({})).to.equal(null)
    expect(Unit.getContentElement({ unit: {}, contentId: 'target' })).to.equal(
      null,
    )
    expect(Unit.getContentElement({ unit, contentId: undefined })).to.equal(
      null,
    )
  })

  it('prefers the requested page and supports page zero', () => {
    expect(
      Unit.getContentElement({ unit, page: 0, contentId: 'target' }),
    ).to.equal(requested)
  })

  it('falls back across empty and non-item page content', () => {
    expect(
      Unit.getContentElement({ unit, page: 1, contentId: 'fallback' }),
    ).to.equal(fallback)
    expect(
      Unit.getContentElement({ unit, page: 20, contentId: 'missing' }),
    ).to.equal(null)
  })
})
