const SimpleSchema = require('simpl-schema')
const schema = def => new SimpleSchema(def)

const settingsSchema = schema({
  public: schema({
    accounts: schema({
      code: schema({
        length: SimpleSchema.Integer
      })
    }),
    packages: schema({
      'dynamic-import': schema({
        useLocationOrigin: {
          type: Boolean,
          optional: true
        }
      })
    }),
    app: schema({
      name: String,
      label: String,
      description: String,
      icon: String,
      logLevel: String
    }),
    tts: schema({
      url: String
    }),
    hosts: schema({
      content: schema({
        base: String,
        tts: String,
        competency: String,
        url: String
      }),
      sessions: schema({
        url: String,
        evalUrl: String,
        responseUrl: String
      })
    })
  }),
  oauth: schema({
    clientId: String,
    secret: String,
    dialogUrl: String,
    accessTokenUrl: String,
    authorizeUrl: String,
    identityUrl: String,
    redirectUrl: String
  }),
  hosts: schema({
    backend: schema({
      urlRegEx: String
    }),
    sessions: schema({
      secret: String
    }),
    content: schema({
      username: String,
      password: String
    })
  }),
  accounts: schema({
    config: schema({
      "forbidClientAccountCreation": Boolean,
      "ambiguousErrorMessages": Boolean,
      "sendVerificationEmail": Boolean,
      "loginExpirationInDays": SimpleSchema.Integer,
      "passwordResetTokenExpirationInDays": SimpleSchema.Integer,
      "passwordEnrollTokenExpirationInDays": SimpleSchema.Integer
    })
  })
})

module.exports = function (settings) {
  settingsSchema.validate(settings)
}
