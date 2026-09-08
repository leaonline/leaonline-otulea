/* eslint-env mocha */
import { expect } from 'chai'
import { Random } from 'meteor/random'
import { DocumentList } from '../DocumentList'
import { createDocumentList } from '../createDocumentList'

describe(DocumentList.name, () => {
  let fieldName
  let context
  let list
  let document
  let currentId

  beforeEach(() => {
    fieldName = Random.id(6)
    context = { name: Random.id(6) }
    list = [Random.id(6), Random.id(6), Random.id(6)]
    document = { [fieldName]: list }
    currentId = list[0]
  })

  it('requires a context and a field', () => {
    expect(() => new DocumentList()).to.throw(
      'Match error: Expected string, got undefined in field contextName',
    )
    expect(() => new DocumentList({})).to.throw(
      'Match error: Expected string, got undefined in field contextName',
    )
    expect(() => new DocumentList({ fieldName: Random.id() })).to.throw(
      'Match error: Expected string, got undefined in field contextName',
    )
    expect(() => new DocumentList({ context: {} })).to.throw(
      'Match error: Expected string, got undefined in field contextName',
    )
    expect(() => new DocumentList({ context: { name: Random.id() } })).to.throw(
      'Match error: Expected string, got undefined in field fieldName',
    )
  })

  describe(DocumentList.prototype.setDocument.name, () => {
    it('throws if the document to be set is not valid', () => {
      expect(() =>
        createDocumentList({
          fieldName,
          context,
        }),
      ).to.throw(`errors.docNotFound [${context.name}.error]`)
    })
    it("throws if the document's list to be set is not valid", () => {
      expect(() =>
        createDocumentList({ fieldName, context, document: {} }),
      ).to.throw('DocumentList.noList')
      expect(() =>
        createDocumentList({
          fieldName,
          context,
          document: { [fieldName]: [] },
        }),
      ).to.throw('DocumentList.noList')
    })
    it('sets the list as internal ref', () => {
      const docList = new DocumentList({ fieldName, context })
      docList.setDocument({
        [fieldName]: list,
      })

      expect(docList.list).to.deep.equal(list)
    })
  })

  describe(DocumentList.prototype.setCurrent.name, () => {
    it('throws if the id is not in list', () => {
      expect(() =>
        createDocumentList({ fieldName, document, context }),
      ).to.throw('DocumentList.idNotInSet')

      expect(() =>
        createDocumentList({
          fieldName,
          document,
          context,
          currentId: Random.id(),
        }),
      ).to.throw('DocumentList.idNotInSet')
    })
    it('sets the index as internal ref', () => {
      const docList = createDocumentList({
        fieldName,
        currentId,
        context,
        document,
      })
      expect(docList.currentId).to.equal(currentId)
    })
  })

  describe(DocumentList.prototype.isLast.name, () => {
    it('returns true if the element is the last', () => {
      const docList = createDocumentList({
        fieldName,
        currentId: list[list.length - 1],
        context,
        document,
      })
      expect(docList.isLast()).to.equal(true)
    })
    it('returns false if the element is not the last', () => {
      const docList = createDocumentList({
        fieldName,
        currentId,
        context,
        document,
      })
      expect(docList.isLast()).to.equal(false)
    })
  })

  describe(DocumentList.prototype.isFirst.name, () => {
    it('returns true if the element is the first', () => {
      const docList = createDocumentList({
        fieldName,
        currentId,
        context,
        document,
      })
      expect(docList.isFirst()).to.equal(true)
    })
    it('returns false if the element is not the first', () => {
      const docList = createDocumentList({
        fieldName,
        currentId: list[list.length - 1],
        context,
        document,
      })
      expect(docList.isFirst()).to.equal(false)
    })
  })

  describe(DocumentList.prototype.getNext.name, () => {
    it('returns the next id', () => {
      const docList = createDocumentList({
        fieldName,
        currentId,
        context,
        document,
      })
      expect(docList.getNext()).to.equal(list[1])
    })
    it('returns null if the current is the last element', () => {
      const docList = createDocumentList({
        fieldName,
        currentId: list[list.length - 1],
        context,
        document,
      })
      expect(docList.getNext()).to.equal(null)
    })
  })
})
