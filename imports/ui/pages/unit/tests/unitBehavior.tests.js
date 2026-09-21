/* eslint-env mocha */
import { expect } from 'chai'
import sinon from 'sinon'
import {
  finishUnit,
  resolveUnitSession,
  submitAndAdvancePage,
} from '../unitBehavior'

const loadedResponse = (overrides = {}) => ({
  sessionDoc: { _id: 'session', currentUnit: 'unit', progress: 2 },
  unitDoc: { _id: 'unit', pages: [{ content: [] }, { content: [] }] },
  unitSetDoc: { _id: 'set' },
  dimensionDoc: { _id: 'dimension' },
  levelDoc: { _id: 'level' },
  color: 'blue',
  ...overrides,
})

const resolve = (options = {}) =>
  resolveUnitSession({
    sessionId: 'session',
    unitId: 'unit',
    responseData: loadedResponse(),
    currentPageCount: 0,
    isComplete: () => false,
    isCurrentUnit: () => true,
    ...options,
  })

describe('unit behavior', () => {
  it('exits for missing route values, response data or linked documents', () => {
    expect(resolve({ sessionId: undefined })).to.deep.equal({ action: 'exit' })
    expect(resolve({ responseData: undefined })).to.deep.equal({ action: 'exit' })
    expect(
      resolve({ responseData: loadedResponse({ levelDoc: undefined }) }),
    ).to.deep.equal({ action: 'exit' })
  })

  it('finishes completed sessions before showing a unit', () => {
    expect(resolve({ isComplete: () => true })).to.deep.equal({
      action: 'finish',
      args: { sessionId: 'session' },
    })
  })

  it('routes an outdated unit URL to the session current unit', () => {
    const responseData = loadedResponse()
    responseData.sessionDoc.currentUnit = 'actual-unit'
    expect(resolve({ responseData, isCurrentUnit: () => false })).to.deep.equal({
      action: 'next',
      args: { unitId: 'actual-unit', sessionId: 'session' },
    })
  })

  it('creates view state for resumed, empty and multi-page units', () => {
    const resumed = resolve({ currentPageCount: 1 })
    expect(resumed.action).to.equal('show')
    expect(resumed.state).to.include({
      currentPageCount: 1,
      maxPages: 2,
      hasNext: false,
    })
    expect(resumed.state.sessionDoc.progress).to.equal(3)

    const empty = resolve({
      responseData: loadedResponse({ unitDoc: { _id: 'unit' } }),
    })
    expect(empty.state.unitDoc.pages).to.deep.equal([])
    expect(empty.state).to.include({ maxPages: 0, hasNext: false })

    const first = resolve()
    expect(first.state.hasNext).to.equal(true)
  })

  it('submits durably before saving or exposing the next page', async () => {
    const order = []
    const sessionDoc = { progress: 4 }
    const newPage = { currentPage: { content: [] }, currentPageCount: 2 }
    const result = await submitAndAdvancePage({
      sessionId: 'session',
      unitDoc: { _id: 'unit' },
      sessionDoc,
      currentPageCount: 1,
      newPage,
      delay: async () => order.push('delay'),
      submitItems: async (args) => {
        order.push('submit')
        expect(args.page).to.equal(1)
      },
      savePage: (key, page) => {
        order.push('save')
        expect(key).to.deep.equal({ unitId: 'unit', sessionId: 'session' })
        expect(page).to.equal(2)
      },
    })

    expect(order).to.deep.equal(['delay', 'submit', 'save'])
    expect(sessionDoc.progress).to.equal(5)
    expect(result).to.deep.equal({ ...newPage, sessionDoc })
  })

  it('does not advance page state when submission fails', async () => {
    const expected = new Error('write rejected')
    const sessionDoc = { progress: 4 }
    const savePage = sinon.spy()
    let actual
    try {
      await submitAndAdvancePage({
        sessionId: 'session',
        unitDoc: { _id: 'unit' },
        sessionDoc,
        currentPageCount: 1,
        newPage: { currentPage: {}, currentPageCount: 2 },
        submitItems: sinon.stub().rejects(expected),
        savePage,
      })
    } catch (error) {
      actual = error
    }
    expect(actual).to.equal(expected)
    expect(savePage.called).to.equal(false)
    expect(sessionDoc.progress).to.equal(4)
  })

  it('rejects undefined destination pages before submission', async () => {
    const submitItems = sinon.spy()
    let error
    try {
      await submitAndAdvancePage({
        newPage: { currentPageCount: 4 },
        submitItems,
      })
    } catch (runtimeError) {
      error = runtimeError
    }
    expect(error.message).to.equal('Undefined page for current index 4')
    expect(submitItems.called).to.equal(false)
  })

  it('finishes in durable order and derives completion navigation', async () => {
    const order = []
    const sessionUpdate = {
      nextUnit: 'next-unit',
      nextUnitSet: 'next-set',
      hasStory: true,
      completed: true,
    }
    const result = await finishUnit({
      sessionId: 'session',
      unitDoc: { _id: 'unit' },
      page: 2,
      submitItems: async () => order.push('submit'),
      flushResponses: () => order.push('flush'),
      callNext: async () => {
        order.push('next')
        return sessionUpdate
      },
      clearPage: () => order.push('clear'),
    })

    expect(order).to.deep.equal(['submit', 'flush', 'next', 'clear'])
    expect(result).to.deep.equal({
      sessionUpdate,
      fadeTarget: '.lea-unit-container',
      navigation: {
        sessionId: 'session',
        unitId: 'next-unit',
        unitSetId: 'next-set',
        hasStory: true,
        completed: true,
      },
    })
  })

  it('never calls the session transition after a rejected final submission', async () => {
    const expected = new Error('response write failed')
    const flushResponses = sinon.spy()
    const callNext = sinon.spy()
    const clearPage = sinon.spy()
    let actual
    try {
      await finishUnit({
        sessionId: 'session',
        unitDoc: { _id: 'unit' },
        page: 2,
        submitItems: sinon.stub().rejects(expected),
        flushResponses,
        callNext,
        clearPage,
      })
    } catch (error) {
      actual = error
    }
    expect(actual).to.equal(expected)
    expect(actual.unitTransitionStage).to.equal('submission')
    expect(flushResponses.called).to.equal(false)
    expect(callNext.called).to.equal(false)
    expect(clearPage.called).to.equal(false)
  })

  it('marks rejected session transitions and retains page cache', async () => {
    const expected = new Error('next failed')
    const clearPage = sinon.spy()
    let actual
    try {
      await finishUnit({
        sessionId: 'session',
        unitDoc: { _id: 'unit' },
        page: 2,
        submitItems: sinon.stub().resolves(),
        flushResponses: sinon.spy(),
        callNext: sinon.stub().rejects(expected),
        clearPage,
      })
    } catch (error) {
      actual = error
    }
    expect(actual).to.equal(expected)
    expect(actual.unitTransitionStage).to.equal('session')
    expect(clearPage.called).to.equal(false)
  })
})
