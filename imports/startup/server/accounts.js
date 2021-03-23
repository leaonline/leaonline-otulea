/* global ServiceConfiguration */
import { Meteor } from 'meteor/meteor'
import { Accounts } from 'meteor/accounts-base'
import { Users } from '../../contexts/user/User'
import { ServiceRegistry } from '../../api/config/BackendConfig'
import { createMethods } from '../../infrastructure/factories/method/createMethods'
import {
  rateLimitMethods,
  rateLimitAccounts,
  rateLimitPublications
} from '../../infrastructure/factories/ratelimit/rateLimit'
import { registerOAuthDDPLoginHandler } from 'meteor/leaonline:ddp-login-handler'
import { createPublications } from '../../infrastructure/factories/publication/createPublication'

//  //////////////////////////////////////////////////////////
//  CUSTOM USERS METHODS
//  //////////////////////////////////////////////////////////
const userMethods = Object.values(Users.methods)
createMethods(userMethods)
rateLimitMethods(userMethods)

const publications = Object.values(Users.publications)
createPublications(publications)
rateLimitPublications(publications)

Meteor.publish(null, function () {
  const { userId } = this
  if (!userId) return this.ready()

  return Meteor.users.find(userId, {
    fields: {
      _id: 1,
      username: 1,
      debug: 1
    }
  })
})

//  //////////////////////////////////////////////////////////
//  RATE LIMIT BUILTIN ACCOUNTS
//  //////////////////////////////////////////////////////////
rateLimitAccounts()

//  //////////////////////////////////////////////////////////
//  LOGIN HANDLER FOR BACKEND
//  //////////////////////////////////////////////////////////
Meteor.startup(() => {
  const { oauth } = Meteor.settings
  ServiceConfiguration.configurations.upsert(
    { service: 'lea' },
    {
      $set: {
        loginStyle: 'popup',
        clientId: oauth.clientId,
        secret: oauth.secret,
        dialogUrl: oauth.dialogUrl,
        accessTokenUrl: oauth.accessTokenUrl,
        identityUrl: oauth.identityUrl,
        redirectUrl: oauth.redirectUrl
      }
    }
  )

  registerOAuthDDPLoginHandler({ identityUrl: oauth.identityUrl })
})

ServiceRegistry.register(Users)
