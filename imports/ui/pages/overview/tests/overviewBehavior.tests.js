/* eslint-env mocha */
import { expect } from 'chai'
import sinon from 'sinon'
import {
  classifySession,
  collectContentFilters,
  getScrollTarget,
  resolveLaunchNavigation,
  sessionRequest,
} from '../overviewBehavior'

describe('overview behavior', () => {
  it('collects stable unique dimension and level filters', () => {
    expect(
      collectContentFilters([
        { dimension: 'd1', level: 'l2' },
        { dimension: 'd1', level: 'l1' },
        { dimension: 'd2', level: 'l2' },
      ]),
    ).to.deep.equal({
      dimensionIds: ['d1', 'd2'],
      levelIds: ['l2', 'l1'],
    })
  })

  it('classifies absent, completed, aborted and unrelated sessions', () => {
    const testCycle = { _id: 'cycle' }
    expect(classifySession({ sessionDoc: undefined, testCycle })).to.deep.equal({
      completedSessionDetected: false,
      abortedSessionDetected: false,
      sessionDoc: null,
    })

    const completed = { _id: 'done', completedAt: new Date() }
    expect(classifySession({ sessionDoc: completed, testCycle })).to.deep.equal({
      completedSessionDetected: true,
      sessionDoc: completed,
    })

    const aborted = { _id: 'open', testCycle: 'cycle' }
    expect(classifySession({ sessionDoc: aborted, testCycle })).to.deep.equal({
      abortedSessionDetected: true,
      sessionDoc: aborted,
    })

    expect(
      classifySession({
        sessionDoc: { _id: 'other', testCycle: 'other-cycle' },
        testCycle,
      }),
    ).to.deep.equal({
      completedSessionDetected: false,
      abortedSessionDetected: false,
    })
  })

  it('builds start, continue and cancel method request data', () => {
    expect(sessionRequest.start('cycle')).to.deep.equal({
      args: { testCycleId: 'cycle' },
      isFreshStart: true,
    })
    expect(sessionRequest.continue('session')).to.deep.equal({
      args: { sessionId: 'session' },
      isFreshStart: false,
    })
    expect(sessionRequest.cancel('session')).to.deep.equal({
      args: { sessionId: 'session' },
    })
  })

  it('routes a fresh session through its story when configured', () => {
    const showStoryBeforeUnit = sinon.stub().returns(true)
    const sessionDoc = {
      _id: 'session',
      currentUnit: 'unit',
      unitSet: 'set',
    }
    const unitSetDoc = { _id: 'set' }
    expect(
      resolveLaunchNavigation({
        sessionDoc,
        unitSetDoc,
        isFreshStart: true,
        showStoryBeforeUnit,
      }),
    ).to.deep.equal({
      target: 'story',
      args: { sessionId: 'session', unitId: 'unit', unitSetId: 'set' },
    })
    expect(showStoryBeforeUnit.calledWith('unit', unitSetDoc)).to.equal(true)
  })

  it('routes continued or story-free sessions directly to the unit', () => {
    const showStoryBeforeUnit = sinon.stub().returns(true)
    expect(
      resolveLaunchNavigation({
        sessionDoc: { _id: 'session', currentUnit: 'unit' },
        unitSetDoc: { _id: 'set' },
        isFreshStart: false,
        showStoryBeforeUnit,
      }),
    ).to.deep.equal({
      target: 'next',
      args: { sessionId: 'session', unitId: 'unit' },
    })
    expect(showStoryBeforeUnit.called).to.equal(false)
  })

  it('selects a scroll target for each valid selection depth', () => {
    expect(getScrollTarget()).to.equal('overview-dimensions-container')
    expect(getScrollTarget({ _id: 'dimension' })).to.equal(
      'overview-level-container',
    )
    expect(getScrollTarget({ _id: 'dimension' }, { _id: 'level' })).to.equal(
      '.overview-session-container',
    )
    expect(getScrollTarget(undefined, { _id: 'level' })).to.equal(undefined)
  })
})
