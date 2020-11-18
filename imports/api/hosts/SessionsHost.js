import { Meteor } from 'meteor/meteor'
import { HTTP } from 'meteor/http'
import { createFixedHMAC } from '../../infrastructure/crypto/createFixedHMAC'

/**
 * This file is intended to be executed Server-only!
 */
export const SessionsHost = {}

// define request urls and header values
const { evalUrl, responseUrl } = Meteor.settings.public.hosts.sessions
const origin = Meteor.absoluteUrl()
const getAuthToken = createFixedHMAC(Meteor.settings.hosts.sessions.secret)

SessionsHost.methods = {}


SessionsHost.methods.submitResponse = function ({ userId, sessionId, taskId, type, contentId, responses, page }) {
  return HTTP.post(responseUrl, {
    data: {
      userId,
      sessionId,
      type,
      taskId,
      responses,
      contentId,
      page: page.toString(10)
    },
    headers: {
      // 'X-Auth-Token': getAuthToken(),
      origin: origin
    }
  })
}

SessionsHost.methods.evaluate = function ({ userId, sessionId }) {
  const results = HTTP.post(evalUrl, {
    data: { sessionId, userId },
    headers: {
      'X-Auth-Token': getAuthToken(),
      origin: origin
    }
  })
  if (!results) return

  // we expect result's content to be a JSON
  return results.content && JSON.parse(results.content)
}
