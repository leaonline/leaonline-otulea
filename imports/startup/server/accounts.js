/* global ServiceConfiguration */
import { Meteor } from 'meteor/meteor'
import { Users } from '../../api/accounts/User'
import { createMethods } from '../../factories/method/createMethods'
import { rateLimitMethods, rateLimitAccounts } from '../../factories/ratelimit/rateLimit'
import { registerOAuthDDPLoginHandler } from 'meteor/leaonline:ddp-login-handler'

//  //////////////////////////////////////////////////////////
//  CUSTOM USERS METHODS
//  //////////////////////////////////////////////////////////
const userMethods = Object.values(Users.methods)
createMethods(userMethods)
rateLimitMethods(userMethods)


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
