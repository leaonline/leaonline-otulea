/* global ServiceConfiguration fetch */
import { Meteor } from 'meteor/meteor'
import { Accounts } from 'meteor/accounts-base'
import { Users } from '../../contexts/user/User'
import { ServiceRegistry } from '../../api/services/ServiceRegistry'
import { createMethods } from '../../infrastructure/factories/method/createMethods'
import {
  rateLimitMethods,
  rateLimitAccounts,
  rateLimitPublications
} from '../../infrastructure/factories/ratelimit/rateLimit'
import { getOAuthDDPLoginHandler, defaultDDPLoginName } from 'meteor/leaonline:ddp-login-handler'
import { createPublications } from '../../infrastructure/factories/publication/createPublication'
import { removeUser } from '../../api/accounts/removeUser'

//  //////////////////////////////////////////////////////////
//  DEFAULT ACCOUNTS CONFIG
//  //////////////////////////////////////////////////////////
Accounts.config(Meteor.settings.accounts.config)

Accounts._defaultPublishFields.projection.isDemoUser = 1
Accounts._defaultPublishFields.projection.debug = 1

//  //////////////////////////////////////////////////////////
//  CUSTOM USERS METHODS
//  //////////////////////////////////////////////////////////
Users.methods.getAll = {
  name: 'users.methods.getAll',
  schema: {
    dependencies: {
      type: Array,
      optional: true
    },
    'dependencies.$': {
      type: Object,
      blackbox: true,
      optional: true
    }
  },
  backend: true,
  run: async function () {
    const users = await Meteor.users.find({}, {
      fields: {
        services: 0,
        agents: 0
      },
      hint: {
        $natural: -1
      }
    }).fetchAsync()

    return { users }
  }
}

Users.methods.remove = {
  name: 'users.methods.remove',
  schema: {
    _id: 1
  },
  backend: true,
  run: async function ({ _id }) {
    return removeUser(_id, this.userId, this.debug)
  }
}

const userMethods = Object.values(Users.methods)
createMethods(userMethods)
rateLimitMethods(userMethods)

const publications = Object.values(Users.publications)
createPublications(publications)
rateLimitPublications(publications)

//  //////////////////////////////////////////////////////////
//  RATE LIMIT BUILTIN ACCOUNTS
//  //////////////////////////////////////////////////////////
rateLimitAccounts()

//  //////////////////////////////////////////////////////////
//  LOGIN HANDLER FOR BACKEND
//  //////////////////////////////////////////////////////////
Meteor.startup(async () => {
  const { oauth } = Meteor.settings
  await ServiceConfiguration.configurations.upsertAsync(
    { service: 'lea' },
    {
      $set: {
        debug: true,
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

  Accounts.registerLoginHandler(defaultDDPLoginName, getOAuthDDPLoginHandler({
    identityUrl: oauth.identityUrl,
    httpGet: async (url, requestOptions) => {
      console.debug('getOAuthDDPLoginHandler: httpGet', url, requestOptions)
      const response = await fetch(url, requestOptions)
      const data = await response.json()
      return { data, status: response.status }
    },
    debug: console.debug
  }))
})

ServiceRegistry.register(Users)
