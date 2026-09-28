/* eslint-env mocha */
import { expect } from 'chai'
import { resolveStorySession, storyNavigation } from '../storyBehavior'

const responseData = (overrides = {}) => ({
  sessionDoc: { _id: 'session' },
  unitSetDoc: { _id: 'set' },
  dimensionDoc: { _id: 'dimension' },
  levelDoc: { _id: 'level' },
  color: 'blue',
  ...overrides,
})

describe('story behavior', () => {
  it('exits when route params, response data or linked documents are missing', () => {
    expect(
      resolveStorySession({
        unitId: undefined,
        sessionId: 'session',
        responseData: responseData(),
      }),
    ).to.deep.equal({ action: 'exit' })
    expect(
      resolveStorySession({
        unitId: 'unit',
        sessionId: 'session',
        responseData: undefined,
      }),
    ).to.deep.equal({ action: 'exit' })
    expect(
      resolveStorySession({
        unitId: 'unit',
        sessionId: 'session',
        responseData: responseData({ levelDoc: undefined }),
      }),
    ).to.deep.equal({ action: 'exit' })
  })

  it('exposes complete story state without template dependencies', () => {
    const loaded = responseData()
    expect(
      resolveStorySession({
        unitId: 'unit',
        sessionId: 'session',
        responseData: loaded,
      }),
    ).to.deep.equal({
      action: 'show',
      state: loaded,
    })
  })

  it('builds next-unit navigation from the loaded session', () => {
    expect(
      storyNavigation({ sessionDoc: { _id: 'session' }, unitId: 'unit' }),
    ).to.deep.equal({ sessionId: 'session', unitId: 'unit' })
  })
})
