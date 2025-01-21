/* eslint-env mocha */
import { expect } from 'chai'
import { isEmptySession } from '../utils/isEmptySession'
import {
  mockCollection,
  restoreCollection,
  clearCollection
} from '../../../../tests/mockCollection'
import { stub, restoreAll } from '../../../../tests/helpers.tests'
import { Session } from '../Session'
import { Response } from '../../response/Response'

describe(isEmptySession.name, async () => {
  before(async () => {
    mockCollection(Session)
    mockCollection(Response)
  })

  after(async () => {
    restoreCollection(Session)
    restoreCollection(Response)
  })

  afterEach(async () => {
    restoreAll()
    await clearCollection(Session)
    await clearCollection(Response)
  })

  it('returns false, if the session has progress', async () => {
    expect(await isEmptySession({ progress: 1 })).to.equal(false)
  })
  it('returns false, if there is no progress but there are response docs', async () => {
    stub(Response, 'collection', () => ({
      countDocuments: async () => 1
    }))
    const values = [undefined, 0, '', null]
    for (const progress of values) {
      expect(await isEmptySession({ progress })).to.equal(false)
    }
  })
  it('returns true, if has no progress and no response docs', async () => {
    stub(Response, 'collection', () => ({
      countDocuments: async () => 0
    }))
    const values = [undefined, 0, '', null]
    for (const progress of values) {
      expect(await isEmptySession({ progress })).to.equal(true)
    }
  })
})
