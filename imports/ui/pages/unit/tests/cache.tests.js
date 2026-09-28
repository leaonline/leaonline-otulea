/* eslint-env mocha */
import { expect } from 'chai'
import { ResponseCache } from '../cache/ResponseCache'
import { UnitPageCache } from '../cache/UnitPageCache'

class TestStorage {
  constructor() {
    this.values = new Map()
  }

  setItem(key, value) {
    this.values.set(key, String(value))
  }

  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null
  }

  removeItem(key) {
    this.values.delete(key)
  }

  getAll() {
    return Object.fromEntries(this.values)
  }
}

describe('unit response caches', () => {
  const canonicalResponses = [['value'], [], [null], ['__undefined__']]

  it('round-trips every canonical raw response array without normalization', () => {
    const storage = new TestStorage()
    const cache = ResponseCache.create(storage)

    canonicalResponses.forEach((responses, index) => {
      const response = {
        sessionId: 'session',
        unitId: 'unit',
        page: 0,
        contentId: `canonical-${index}`,
        responses,
      }
      cache.save(response)
      expect(cache.load(response)).to.deep.equal(response)
    })
  })

  it('saves, loads and clears independent item responses', () => {
    const storage = new TestStorage()
    const cache = ResponseCache.create(storage)
    const first = {
      sessionId: 'session',
      unitId: 'unit',
      page: 0,
      contentId: 'first',
      responses: ['a'],
    }
    const second = { ...first, contentId: 'second', responses: ['b'] }

    const firstSaved = cache.save(first)
    const secondSaved = cache.save(second)
    expect(firstSaved.key).to.not.equal(secondSaved.key)
    expect(cache.load(first)).to.deep.equal(first)
    expect(cache.load(second)).to.deep.equal(second)
    expect(cache.clear(first)).to.equal(true)
    expect(cache.load(first)).to.equal(null)
    expect(cache.clear(first)).to.equal(true)
  })

  it('flushes response/development entries without touching unrelated storage', () => {
    const storage = new TestStorage()
    storage.setItem('rc-one', 'one')
    storage.setItem('old-development-entry', 'two')
    storage.setItem('keep', 'three')

    ResponseCache.create(storage).flush()

    expect(storage.getItem('rc-one')).to.equal(null)
    expect(storage.getItem('old-development-entry')).to.equal(null)
    expect(storage.getItem('keep')).to.equal('three')
  })

  it('saves, loads and clears the last unit page independently per unit', () => {
    const storage = new TestStorage()
    const cache = UnitPageCache.create(storage)
    const first = { sessionId: 'session', unitId: 'first' }
    const second = { sessionId: 'session', unitId: 'second' }

    cache.save(first, 0)
    cache.save(second, 3)
    expect(cache.load(first)).to.equal(0)
    expect(cache.load(second)).to.equal(3)
    cache.clear(first)
    expect(Number.isNaN(cache.load(first))).to.equal(true)
    expect(cache.load(second)).to.equal(3)
  })
})
