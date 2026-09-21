/* eslint-env mocha */
import { expect } from 'chai'
import sinon from 'sinon'
import { createSessionLoader } from '../createSessionLoader'

const createContexts = () => ({
  UnitSet: { name: 'unitSet' },
  Level: { name: 'level' },
  Dimension: { name: 'dimension' },
  Session: {
    name: 'session',
    methods: { currentById: { name: 'session.current' } },
  },
  Unit: { name: 'unit' },
})

describe('createSessionLoader', () => {
  it('initializes its five client contexts exactly once', () => {
    const contexts = createContexts()
    const initializeContext = sinon.spy()

    expect(createSessionLoader({ contexts, initializeContext })).to.be.a(
      'function',
    )
    expect(initializeContext.args.map(([context]) => context.name)).to.deep.equal(
      ['unitSet', 'level', 'dimension', 'session', 'unit'],
    )
  })

  it('loads explicit ids and resolves dependent documents and color', async () => {
    const contexts = createContexts()
    const call = sinon.stub().resolves({ _id: 'session-1', unitSet: 'derived' })
    const documents = {
      unit: { _id: 'unit-1' },
      unitSet: { _id: 'explicit', level: 'level-1', dimension: 'dimension-1' },
      level: { _id: 'level-1' },
      dimension: { _id: 'dimension-1', colorType: 2 },
    }
    const load = sinon.stub().callsFake(({ context }) => documents[context.name])
    const loader = createSessionLoader({
      contexts,
      initializeContext: () => {},
      call,
      load,
      isDevelopment: false,
      colorByIndex: (index) => ({ type: `color-${index}` }),
    })

    const result = await loader({
      sessionId: 'session-1',
      unitId: 'unit-1',
      unitSetId: 'explicit',
    })

    expect(call.firstCall.args[0]).to.deep.equal({
      name: 'session.current',
      args: { sessionId: 'session-1' },
    })
    expect(load.args.map(([args]) => args.query)).to.deep.equal([
      { _id: 'unit-1' },
      { _id: 'explicit' },
      { _id: 'level-1' },
      { _id: 'dimension-1' },
    ])
    expect(load.args.every(([args]) => args.unlessExists === true)).to.equal(
      true,
    )
    expect(result).to.deep.equal({
      sessionDoc: { _id: 'session-1', unitSet: 'derived' },
      unitSetDoc: documents.unitSet,
      unitDoc: documents.unit,
      levelDoc: documents.level,
      dimensionDoc: documents.dimension,
      color: 'color-2',
    })
  })

  it('derives the unit-set id from the session and tolerates missing ids', async () => {
    const contexts = createContexts()
    const call = sinon.stub().resolves({ _id: 'session-1', unitSet: 'derived' })
    const load = sinon.stub().callsFake(({ context, query }) => {
      if (context.name === 'unitSet') {
        return { _id: query._id, level: 'level-1', dimension: 'dimension-1' }
      }
      return { _id: query._id }
    })
    const loader = createSessionLoader({
      contexts,
      initializeContext: () => {},
      call,
      load,
      isDevelopment: false,
    })

    const derived = await loader({ sessionId: 'session-1' })
    expect(derived.unitSetDoc._id).to.equal('derived')
    expect(derived.unitDoc).to.equal(undefined)

    call.resetHistory()
    load.resetHistory()
    const empty = await loader({})
    expect(call.called).to.equal(false)
    expect(load.called).to.equal(false)
    expect(empty).to.deep.equal({
      sessionDoc: undefined,
      unitSetDoc: undefined,
      unitDoc: undefined,
      levelDoc: undefined,
      dimensionDoc: undefined,
      color: undefined,
    })
  })

  it('rewrites every development image surface', async () => {
    const contexts = createContexts()
    const story = { subtype: 'image', value: 'story' }
    const instruction = { subtype: 'image', value: 'instruction' }
    const stimulus = { subtype: 'image', value: 'stimulus' }
    const content = { subtype: 'image', value: 'content' }
    const rewriteImage = sinon.spy()
    const load = sinon.stub().callsFake(({ context }) => {
      if (context.name === 'unit') {
        return {
          _id: 'unit-1',
          instructions: [instruction],
          stimuli: [stimulus],
          pages: [{ content: [content] }, {}],
        }
      }
      if (context.name === 'unitSet') {
        return { _id: 'set-1', story: [story] }
      }
    })
    const loader = createSessionLoader({
      contexts,
      initializeContext: () => {},
      load,
      rewriteImage,
      isDevelopment: true,
    })

    await loader({ unitId: 'unit-1', unitSetId: 'set-1' })

    expect(rewriteImage.args.map(([element]) => element)).to.deep.equal([
      story,
      instruction,
      stimulus,
      content,
    ])
  })

  it('propagates dependency loading failures', async () => {
    const expected = new Error('load failed')
    const loader = createSessionLoader({
      contexts: createContexts(),
      initializeContext: () => {},
      load: sinon.stub().rejects(expected),
    })

    let actual
    try {
      await loader({ unitSetId: 'set-1' })
    } catch (error) {
      actual = error
    }
    expect(actual).to.equal(expected)
  })
})
