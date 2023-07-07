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
import { onServerExec } from '../../../utils/archUtils'

describe(getSessionDoc.name, function () {
  let userId
  let sessionId
  let val
  let stubSession

  beforeEach(function () {
    mockCollection(Session)
    userId = Random.id()
    sessionId = Random.id()
    val = Random.id()
    stubSession = () =>  stub(Session, 'collection', () => ({
      findOne: ({ _id, userId }) => {
        expect(_id).to.equal(sessionId)
        expect(userId).to.equal(userId)
        return val
      }
    }))
  })
  afterEach(function () {
    restoreCollection(Session)
    restoreAll()
  })

  it('returns the sessionDoc only for the given user', function () {
    stubSession()
    const data = { sessionId, userId }
    expect(getSessionDoc(data)).to.equal(val)
  })

  onServerExec(function () {
    it('runs as method', function () {
      stubSession()
      const env = { userId }
      const arg = { sessionId }
      expect(Session.methods.currentById.run.call(env, arg)).to.equal(val)
    })
  })
})
