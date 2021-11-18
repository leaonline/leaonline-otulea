const SimpleSchema = require('simpl-schema')
const schema = def => new SimpleSchema(def)

const settingsSchema = schema({
  public: schema({
    status: String,
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
  email: schema({
    notify: {
      type: Array,
      optional: true
    },
    'notify.$': SimpleSchema.RegEx.Email,
    replyTo: {
      type: SimpleSchema.RegEx.Email,
      optional: true
    },
    from: {
      type: SimpleSchema.RegEx.Email,
      optional: true
    }
  }),
  accounts: schema({
    removeOlderThanDays: {
      type: SimpleSchema.Integer,
      min: 1
    },
    removeIncompleteSessions: {
      type: Boolean
    },
    config: schema({
      "forbidClientAccountCreation": Boolean,
      "ambiguousErrorMessages": Boolean,
      "sendVerificationEmail": Boolean,
      "loginExpirationInDays": SimpleSchema.Integer,
      "passwordResetTokenExpirationInDays": SimpleSchema.Integer,
      "passwordEnrollTokenExpirationInDays": SimpleSchema.Integer
    })
  }),
  status: schema({
    active: Boolean,
    interval: Number,
    secret: String,
    url: String
  }),
  patches: schema({
    dryRun: Boolean,
    addDimensionToFeedback: Boolean
  })
})

module.exports = function (settings) {
  settingsSchema.validate(settings)
}
