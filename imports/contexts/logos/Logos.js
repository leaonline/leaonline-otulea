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
  },
  'footer.$.width': {
    type: Number,
    label: 'logos.width',
    optional: true
  },
  'footer.$.height': {
    type: Number,
    label: 'logos.height',
    optional: true
  },
  'footer.$.href': {
    type: String,
    label: 'logos.href',
    optional: true
  }
}

Logos.methods = {}

Logos.methods.update = {
  name: 'logos.methods.update',
  numRequests: 1,
  backend: true,
  timeInterval: 250,
  schema: Object.assign({}, Logos.schema, {
    _id: {
      type: String,
      optional: true
    }
  }),
  run: onServer(function ({ footer }) {
    const LogoCollection = Logos.collection()
    const logoDoc = LogoCollection.findOne()
    if (!logoDoc) {
      return LogoCollection.insert({ footer })
    }
    else {
      return LogoCollection.update(logoDoc._id, { $set: { footer } })
    }
  })
}

Logos.methods.get = {
  name: 'logos.methods.get',
  isPublic: true,
  numRequests: 1,
  timeInterval: 250,
  schema: {
    _id: {
      type: String,
      optional: true
    }
  },
  run: onServer(function () {
    return Logos.collection().findOne() || {}
  }),
  call: onClient(function (cb) {
    Meteor.call(Logos.methods.get.name, cb)
  })
}
