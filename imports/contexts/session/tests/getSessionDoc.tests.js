/* eslint-env mocha */
import { expect } from 'chai'
import { Random } from 'meteor/random'
import { getSessionDoc } from '../utils/getSessionDoc'
import { Session } from '../../session/Session'
import {
  mockCollection,
  restoreCollection
} from '../../../../tests/mockCollection'
import { restoreAll, stub } from '../../../../tests/helpers.tests'

describe(getSessionDoc.name, function () {
  beforeEach(function () {
    mockCollection(Session)
  })
  afterEach(function () {
    restoreCollection(Session)
    restoreAll()
  })
  it('returns the sessionDoc only for the given user', function () {
    const data = {
      sessionId: Random.id(),
      userId: Random.id()
    }
    const val = Random.id()
    stub(Session, 'collection', () => ({
      findOne: ({ _id, userId }) => {
        expect(_id).to.equal(data.sessionId)
        expect(userId).to.equal(data.userId)
        return val
      }
    }))

    expect(getSessionDoc(data)).to.equal(val)
  })
})
