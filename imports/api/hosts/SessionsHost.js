import { Meteor } from 'meteor/meteor'
import { HTTP } from 'meteor/http'

const settings = Meteor.settings.public.hosts.sessions
const sessionCredential = Meteor.isServer && Meteor.settings.hosts.sessions.secret
const evalUrl = settings.evalUrl
const responseUrl = settings.responseUrl

export const SessionsHost = {}

SessionsHost.methods = {}

SessionsHost.methods.submitResponse = function ({ userId, sessionId, taskId, type, contentId, responses, page }) {
  return HTTP.post(responseUrl, {
    data: { userId, sessionId, type, taskId, responses, contentId, page: page.toString(10) },
    headers: {
      'X-Auth-Token': sessionCredential
    }
  })
}

SessionsHost.methods.evaluate = function ({ userId, sessionId }) {
  const results = HTTP.post(evalUrl, {
    data: { sessionId, userId },
    headers: {
      'X-Auth-Token': sessionCredential
    }
  })
  if (!results) return

  // we expect result's content to be a JSON
  return results.content && JSON.parse(results.content)
}
