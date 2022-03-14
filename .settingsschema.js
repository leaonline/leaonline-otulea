const SimpleSchema = require('simpl-schema')
const schema = def => new SimpleSchema(def)

const settingsSchema = schema({
  public: schema({
    defaultLocale: String,
    issueMail: String,
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
    }),
    error: schema({
      maxStackSize: SimpleSchema.Integer
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
    config: schema({
      "forbidClientAccountCreation": Boolean,
      "ambiguousErrorMessages": Boolean,
      "sendVerificationEmail": Boolean,
      "loginExpirationInDays": SimpleSchema.Integer,
      "passwordResetTokenExpirationInDays": SimpleSchema.Integer,
      "passwordEnrollTokenExpirationInDays": SimpleSchema.Integer
    })
  }),
  records: schema({
    defaultOldest: SimpleSchema.Integer
  }),
  status: schema({
    active: Boolean,
    interval: Number,
    secret: String,
    url: String
  }),
  patches: schema({
    removeDeadAccounts: schema({
      active: Boolean,
      dryRun: Boolean,
      removeOlderThanDays: {
        type: SimpleSchema.Integer,
        min: 0
      },
      removeIncompleteSessions: {
        type: Boolean
      },
      byComment: {
        type: String,
        optional: true
      }
    }),
    addDimensionToFeedback: schema({
      active: Boolean,
      dryRun: Boolean
    }),
    generateAccounts: schema({
      dryRun: Boolean,
      active: Boolean,
      amount: Number,
      comment: String,
      notify: Array,
      'notify.$': String
    })
  })
})

module.exports = function (settings) {
  settingsSchema.validate(settings)
}
