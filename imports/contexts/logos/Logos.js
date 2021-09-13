import { Meteor } from 'meteor/meteor'
import { onClient, onServer } from '../../utils/archUtils'

export const Logos = {
  name: 'logos',
  label: 'logos.title',
  icon: 'images',
  isConfigDoc: true
}

Logos.schema = {
  footer: {
    type: Array,
    label: 'logos.footer',
    optional: false
  },
  'footer.$': {
    type: Object,
    label: 'common.entry'
  },
  'footer.$.url': {
    type: String,
    label: 'logos.logoUrl',
    isMediaUrl: true
  },
  'footer.$.title': {
    type: String,
    label: 'logos.logoTitle',
    optional: true
  }
}

Logos.publications = {}

Logos.publications.single = {
  name: 'logos.publications.single',
  isPublic: true,
  schema: {},
  numRequests: 1,
  timeInterval: 250,
  run: onServer(function () {
    return Logos.collection().find({}, { limit: 1 })
  })
}

Logos.methods = {}

Logos.methods.update = {
  name: 'logos.methods.update',
  numRequests: 1,
  timeInterval: 250,
  schema: Object.assign({}, Logos.schema, {
    _id: {
      type: String,
      optional: true
    }
  }),
  run: onServer(function ({ mainLogo, footer }) {
    const LogoCollection = Logos.collection()
    const logoDoc = LogoCollection.findOne()
    if (!logoDoc) {
      return LogoCollection.insert({ mainLogo, footer })
    }
    else {
      return LogoCollection.update(logoDoc._id, { $set: { mainLogo, footer } })
    }
  })
}

Logos.methods.get = {
  name: 'logos.methods.get',
  isPublic: true,
  numRequests: 1,
  timeInterval: 250,
  schema: {},
  run: onServer(function ({ name } = {}) {
    return Logos.collection().findOne()
  }),
  call: onClient(function (cb) {
    Meteor.call(Logos.methods.get.name, cb)
  })
}
