import { Users } from '../../api/accounts/User'
import { Accounts } from 'meteor/accounts-base'
import { RateLimiterRegistry } from '../../factories/ratelimit/RateLimiterRegistry'
import { createMethods } from '../../factories/method/createMethods'
import { rateLimitMethods } from '../../factories/ratelimit/rateLimit'

//  //////////////////////////////////////////////////////////
//  CUSTOM USERS METHODS
//  //////////////////////////////////////////////////////////
const userMethods = Object.values(Users.methods)
createMethods(userMethods)
rateLimitMethods(userMethods)

//  //////////////////////////////////////////////////////////
//  BUILTIN ACCOUNTS
//  //////////////////////////////////////////////////////////
Accounts.removeDefaultRateLimit()

// Get a list of all accounts methods by running `Meteor.server.method_handlers` in meteor shell
;[
  'login',
  'loginWithToken',
  'logout',
  'logoutOtherClients',
  'getNewToken',
  'removeOtherTokens',
  'configureLoginService',
  'changePassword',
  'forgotPassword',
  'resetPassword',
  'verifyEmail',
  'createUser',
  'ATRemoveService',
  'ATCreateUserServer',
  'ATResendVerificationEmail'
].forEach(name => RateLimiterRegistry.addMethod({ name, numRequests: 5, timeInterval: 10000 }))

//  //////////////////////////////////////////////////////////
//  BUILTIN PUBLICATIONS
//  //////////////////////////////////////////////////////////
;[
  'meteor.loginServiceConfiguration',
  'meteor_autoupdate_clientVersions',
  '_roles'
].forEach(name => RateLimiterRegistry.addPublication({ name, timeInterval: 10000, numRequests: 20 }))