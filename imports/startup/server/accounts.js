/* global ServiceConfiguration */
import { Meteor } from 'meteor/meteor'
import { Accounts } from 'meteor/accounts-base'
import { HTTP } from 'meteor/jkuester:http'
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
  run: function () {
    const users = Meteor.users.find({}, {
      fields: {
        services: 0,
        agents: 0
      },
      hint: {
        $natural: -1
      }
    }).fetch()

    return { users }
  }
}

Users.methods.remove = {
  name: 'users.methods.remove',
  schema: {
    _id: 1
  },
  backend: true,
  run: function ({ _id }) {
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

  const loginHandler = getOAuthDDPLoginHandler({
    identityUrl: oauth.identityUrl,
    httpGet: (url, requestOptions) => HTTP.get(url, requestOptions),
    debug: console.debug
  })

  Accounts.registerLoginHandler(defaultDDPLoginName, loginHandler)
})

ServiceRegistry.register(Users)
