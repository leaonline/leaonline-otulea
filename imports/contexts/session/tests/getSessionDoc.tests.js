/* eslint-env mocha */
import { expect } from 'chai'
import { Random } from 'meteor/random'
import { getSessionDoc } from '../utils/getSessionDoc'
import { Session } from '../../session/Session'
import {
  mockCollection,
  restoreCollection,
} from '../../../../tests/mockCollection'
import { restoreAll, stub } from '../../../../tests/helpers.tests'
import { onServerExec } from '../../../utils/archUtils'

describe(getSessionDoc.name, () => {
  let userId
  let sessionId
  let val
  let stubSession

  beforeEach(() => {
    mockCollection(Session)
    userId = Random.id()
    sessionId = Random.id()
    val = Random.id()
    stubSession = () =>
      stub(Session, 'collection', () => ({
        findOneAsync: async ({ _id, userId }) => {
          expect(_id).to.equal(sessionId)
          expect(userId).to.equal(userId)
          return val
        },
      }))
  })
  afterEach(() => {
    restoreCollection(Session)
    restoreAll()
  })

  it('returns the sessionDoc only for the given user', async () => {
    stubSession()
    const data = { sessionId, userId }
    expect(await getSessionDoc(data)).to.equal(val)
  })

  onServerExec(() => {
    it('runs as method', async () => {
      stubSession()
      const env = { userId }
      const arg = { sessionId }
      expect(await Session.methods.currentById.run.call(env, arg)).to.equal(val)
    })
  })
})
