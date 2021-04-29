/* eslint-env mocha */
import { expect } from 'chai'
import { Random } from 'meteor/random'
import { isEmptySession } from '../utils/isEmptySession'
import {
  mockCollection,
  restoreCollection
} from '../../../../tests/mockCollection'
import { stub, restoreAll } from '../../../../tests/helpers.tests'
import { Session } from '../Session'
import { Response } from '../../response/Response'

describe(isEmptySession.name, function () {
  beforeEach(function () {
    mockCollection(Session)
    mockCollection(Response)
  })
  afterEach(function () {
    restoreCollection(Session)
    restoreCollection(Response)
    restoreAll()
  })

  it('returns false, if the session has progress', function () {
    expect(isEmptySession({ progress: 1 })).to.equal(false)
  })
  it('returns false, if there is no progress but there are response docs', function () {
    stub(Response, 'collection', () => ({
      find: () => ({
        count: () => 1
      })
    }))
    ;[undefined, 0, '', null].forEach(progress  => {
      expect(isEmptySession({ progress })).to.equal(false)
    })
  })
  it('returns true, if has no progress and no response docs', function () {
    stub(Response, 'collection', () => ({
      find: () => ({
        count: () => 0
      })
    }))
    ;[undefined, 0, '', null].forEach(progress  => {
      expect(isEmptySession({ progress })).to.equal(true)
    })
  })
})
