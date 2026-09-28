/* eslint-env mocha */
import { expect } from 'chai'
import sinon from 'sinon'
import { createItemInput } from '../item/createItemInput'
import { createItemLoad } from '../item/createItemLoad'
import { createItemSubmit } from '../item/createItemSubmit'

describe('unit item callbacks', () => {
  const canonicalResponses = [['value'], [], [null], ['__undefined__']]
  const itemData = {
    userId: 'user',
    sessionId: 'session',
    unitId: 'unit',
    page: 0,
    type: 'item',
    contentId: 'content',
    responses: ['answer'],
  }

  it('caches the complete item input and reports its key/value', () => {
    const cache = { save: sinon.stub().returns({ key: 'key', value: 'value' }) }
    const debug = sinon.spy()

    expect(createItemInput({ cache, debug })(itemData)).to.deep.equal({
      key: 'key',
      value: 'value',
    })
    expect(cache.save.calledWith(itemData)).to.equal(true)
    expect(debug.calledTwice).to.equal(true)
  })

  it('passes all canonical raw arrays through input and load adapters exactly', () => {
    canonicalResponses.forEach((responses, index) => {
      const data = {
        ...itemData,
        contentId: `canonical-${index}`,
        responses,
      }
      const cache = {
        save: sinon.stub().callsFake((value) => ({
          key: value.contentId,
          value: `encoded-${index}`,
        })),
        load: sinon.stub().returns(data),
      }

      expect(createItemInput({ cache })(data)).to.deep.equal({
        key: data.contentId,
        value: `encoded-${index}`,
      })
      expect(cache.save.calledOnceWithExactly(data)).to.equal(true)
      expect(createItemLoad({ cache })(data)).to.deep.equal(data)
      expect(cache.load.calledOnce).to.equal(true)
    })
  })

  it('loads existing values and optionally creates a missing empty response', () => {
    const cache = {
      load: sinon.stub().returns({ responses: ['cached'] }),
      save: sinon.stub().returns({ key: 'new' }),
    }
    expect(createItemLoad({ cache })(itemData)).to.deep.equal({
      responses: ['cached'],
    })
    expect(cache.save.called).to.equal(false)

    cache.load.returns(undefined)
    expect(createItemLoad({ cache })(itemData)).to.equal(undefined)
    expect(
      createItemLoad({ cache, createIfMissing: true })(itemData),
    ).to.deep.equal({ key: 'new' })
    expect(cache.save.firstCall.args[0]).to.deep.equal({
      ...itemData,
      responses: [],
    })
  })

  it('skips empty/non-item content and submits multiple independent items', async () => {
    const calls = []
    const methodCall = sinon.stub().callsFake(async (options) => {
      options.prepare()
      options.receive()
      const result = `saved:${options.args.contentId}`
      options.success(result)
      return result
    })
    const loadValue = ({ contentId }) =>
      contentId === 'first' ? { responses: ['a'] } : undefined
    const submit = createItemSubmit({
      loadValue,
      methodCall,
      prepare: (doc) => calls.push(`prepare:${doc.contentId}`),
      receive: (doc) => calls.push(`receive:${doc.contentId}`),
      onSuccess: (result, doc) => calls.push(`${result}:${doc.contentId}`),
    })
    const unitDoc = {
      _id: 'unit',
      pages: [
        {
          content: [
            { type: 'text', contentId: 'text' },
            { type: 'item', contentId: 'first' },
            { type: 'item', contentId: 'second' },
          ],
        },
      ],
    }

    expect(
      await submit({ sessionId: 'session', unitDoc, page: 10 }),
    ).to.deep.equal([])
    expect(
      await submit({ sessionId: 'session', unitDoc, page: 0 }),
    ).to.deep.equal(['saved:first', 'saved:second'])
    expect(methodCall.args.map(([options]) => options.args)).to.deep.equal([
      {
        sessionId: 'session',
        unitId: 'unit',
        page: 0,
        contentId: 'first',
        responses: ['a'],
      },
      {
        sessionId: 'session',
        unitId: 'unit',
        page: 0,
        contentId: 'second',
        responses: [],
      },
    ])
    expect(calls).to.deep.equal([
      'prepare:first',
      'receive:first',
      'saved:first:first',
      'prepare:second',
      'receive:second',
      'saved:second:second',
    ])
  })

  it('does not hide a rejected durable submission', async () => {
    const expected = new Error('write failed')
    const onError = sinon.spy()
    const methodCall = sinon.stub().callsFake(async (options) => {
      options.prepare()
      options.receive()
      options.failure(expected)
      throw expected
    })
    const submit = createItemSubmit({
      loadValue: () => ({ responses: [] }),
      methodCall,
      onError,
    })
    const unitDoc = {
      _id: 'unit',
      pages: [{ content: [{ type: 'item', contentId: 'first' }] }],
    }

    let actual
    try {
      await submit({ sessionId: 'session', unitDoc, page: 0 })
    } catch (error) {
      actual = error
    }
    expect(actual).to.equal(expected)
    expect(onError.calledWith(expected)).to.equal(true)
  })

  it('submits canonical arrays unchanged and defaults only a missing cache value', async () => {
    const responseByContent = {
      entered: ['value'],
      absent: [],
      deleted: [null],
      omitted: ['__undefined__'],
      invalid: null,
    }
    const methodCall = sinon.stub().resolves('saved')
    const submit = createItemSubmit({
      loadValue: ({ contentId }) =>
        contentId === 'missing'
          ? undefined
          : { responses: responseByContent[contentId] },
      methodCall,
    })
    const contentIds = [...Object.keys(responseByContent), 'missing']
    const unitDoc = {
      _id: 'unit',
      pages: [
        {
          content: contentIds.map((contentId) => ({ type: 'item', contentId })),
        },
      ],
    }

    await submit({ sessionId: 'session', unitDoc, page: 0 })

    expect(
      methodCall.args.map(([options]) => options.args.responses),
    ).to.deep.equal([['value'], [], [null], ['__undefined__'], null, []])
  })
})
