const SimpleSchema = require('simpl-schema')
const schema = def => new SimpleSchema(def)

const settingsSchema = schema({
  public: schema({
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
      secret: String
    })
  })
})

module.exports = function (settings) {
  settingsSchema.validate(settings)
}
