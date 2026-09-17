/* eslint-env mocha */
import { expect } from 'chai'
import { Random } from 'meteor/random'
import { extractItemDefinition } from '../extractItemDefinition'

const toErr = (name) => `${extractItemDefinition.name}.${name}`

describe(extractItemDefinition.name, () => {
  it('throws on incomplete params', () => {
    Object.entries({
      unitDoc: {},
      page: { unitDoc: {} },
      contentId: { unitDoc: {}, page: 0 },
    }).forEach(([key, params]) => {
      expect(() => extractItemDefinition(params)).to.throw(
        `Missing key '${key}'`,
      )
    })
  })
  it('throws on n valid page index', () => {
    const doc = {
      unitDoc: { _id: Random.id(), pages: [{}] },
      page: -1,
      contentId: Random.id(),
    }

    expect(() => extractItemDefinition(doc)).to.throw(
      toErr('arrayIndexOutOfBounds'),
    )

    doc.page = 2
    expect(() => extractItemDefinition(doc)).to.throw(
      toErr('arrayIndexOutOfBounds'),
    )
  })
  it('throws if there is no content', () => {
    const doc = {
      unitDoc: { _id: Random.id(), pages: [{}] },
      page: 0,
      contentId: Random.id(),
    }

    expect(() => extractItemDefinition(doc)).to.throw(toErr('noContent'))

    doc.unitDoc.pages[0].content = []

    expect(() => extractItemDefinition(doc)).to.throw(toErr('noContent'))
  })
  it('throws if there is no entry by contentId', () => {
    const doc = {
      unitDoc: {
        _id: Random.id(),
        pages: [
          {
            content: [{}, {}, { contentId: Random.id() }],
          },
        ],
      },
      page: 0,
      contentId: Random.id(),
    }

    expect(() => extractItemDefinition(doc)).to.throw(toErr('entryNotFound'))
  })
  it('returns the entry by contentId', () => {
    const contentId = Random.id()
    const entry = { contentId }
    const doc = {
      unitDoc: {
        _id: Random.id(),
        pages: [
          {
            content: [{}, {}, { contentId: Random.id() }, entry],
          },
        ],
      },
      page: 0,
      contentId,
    }

    expect(extractItemDefinition(doc)).to.deep.equal(entry)
  })
})
