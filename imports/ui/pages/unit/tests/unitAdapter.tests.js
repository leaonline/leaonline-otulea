/* eslint-env mocha */
import { expect } from 'chai'
import sinon from 'sinon'
import { finishUnitFromTemplate, onPageNavUpdate } from '../unit'

const createState = (initial) => {
  const values = new Map(Object.entries(initial))
  return {
    get: (key) => values.get(key),
    set(key, value) {
      if (typeof key === 'object') {
        Object.entries(key).forEach(([name, entry]) => values.set(name, entry))
      } else {
        values.set(key, value)
      }
    },
    snapshot: () => Object.fromEntries(values),
  }
}

const createUnitInstance = () => {
  const next = sinon.spy()
  const state = createState({
    currentPageCount: 0,
    sessionDoc: { _id: 'session', progress: 0 },
    unitDoc: { _id: 'unit', pages: [{ content: [] }, { content: [] }] },
  })
  return {
    state,
    data: { next },
    api: {
      callMethod: sinon.stub().resolves(),
      debug: sinon.spy(),
      fadeOut: (_target, callback) => callback(),
      info: sinon.spy(),
    },
  }
}

describe('unit Blaze adapter', () => {
  it('commits renderer and parent page state only after durable submission', async () => {
    const templateInstance = createUnitInstance()
    const onComplete = sinon.spy()
    const releaseWaiting = sinon.spy()
    const savePage = sinon.spy()
    const newPage = {
      currentPage: { content: [] },
      currentPageCount: 1,
      hasNext: false,
    }

    const result = await onPageNavUpdate({
      action: 'next',
      newPage,
      templateInstance,
      onComplete,
      submit: sinon.stub().resolves(),
      savePage,
      delay: () => Promise.resolve(),
      releaseWaiting,
    })

    expect(result).to.include(newPage)
    expect(templateInstance.state.snapshot()).to.include({
      currentPageCount: 1,
      hasNext: false,
    })
    expect(onComplete.calledOnceWithExactly()).to.equal(true)
    expect(releaseWaiting.called).to.equal(false)
    expect(
      savePage.calledOnceWithExactly(
        { unitId: 'unit', sessionId: 'session' },
        1,
      ),
    ).to.equal(true)
  })

  it('releases renderer waiting without advancing either wiring state on rejection', async () => {
    const templateInstance = createUnitInstance()
    const before = templateInstance.state.snapshot()
    const expected = new Error('durable response rejected')
    const onComplete = sinon.spy()
    const releaseWaiting = sinon.spy()
    const savePage = sinon.spy()
    const onError = sinon.spy()

    const result = await onPageNavUpdate({
      action: 'next',
      newPage: { currentPage: { content: [] }, currentPageCount: 1 },
      templateInstance,
      onComplete,
      submit: sinon.stub().rejects(expected),
      savePage,
      delay: () => Promise.resolve(),
      releaseWaiting,
      onError,
    })

    expect(result).to.equal(undefined)
    expect(templateInstance.state.snapshot()).to.deep.equal(before)
    expect(onComplete.called).to.equal(false)
    expect(savePage.called).to.equal(false)
    expect(releaseWaiting.calledOnceWithExactly(templateInstance)).to.equal(
      true,
    )
    expect(onError.calledOnceWithExactly(expected)).to.equal(true)
  })

  it('routes finish only after the adapter completes response and session writes', async () => {
    const templateInstance = createUnitInstance()
    const transition = {
      sessionUpdate: { completed: true },
      fadeTarget: '.lea-unit-container',
      navigation: { sessionId: 'session', completed: true },
    }
    const finish = sinon.stub().resolves(transition)

    expect(
      await finishUnitFromTemplate({
        templateInstance,
        finish,
        submit: sinon.spy(),
        flushResponses: sinon.spy(),
        callNext: sinon.spy(),
        clearPage: sinon.spy(),
      }),
    ).to.equal(transition)

    expect(finish.calledOnce).to.equal(true)
    expect(templateInstance.state.get('unitDoc')).to.equal(null)
    expect(templateInstance.state.get('fadedOut')).to.equal(true)
    expect(
      templateInstance.data.next.calledOnceWithExactly(transition.navigation),
    ).to.equal(true)
  })

  it('keeps finish routing available after a rejected durable response', async () => {
    const templateInstance = createUnitInstance()
    const error = Object.assign(new Error('response rejected'), {
      unitTransitionStage: 'submission',
    })
    const onError = sinon.spy()

    expect(
      await finishUnitFromTemplate({
        templateInstance,
        finish: sinon.stub().rejects(error),
        onError,
      }),
    ).to.equal(undefined)

    expect(templateInstance.state.get('finishing')).to.equal(false)
    expect(templateInstance.data.next.called).to.equal(false)
    expect(onError.calledOnceWithExactly(error)).to.equal(true)
  })
})
