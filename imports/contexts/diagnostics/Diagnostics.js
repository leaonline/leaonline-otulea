import { runDiagnostics } from './api/runDiagnostics'
import { onServer } from '../../utils/archUtils'

export const Diagnostics = {
  name: 'diagnostics',
  label: 'diagnostics.title',
  icon: 'microscope',
  representative: 'allPassed'
}

const optionalStr = {
  type: String,
  optional: true
}

const optionalBoolean = {
  type: Boolean,
  optional: true
}

const optionalNumber = {
  type: Number,
  optional: true
}

Diagnostics.schema = {
  createdAt: {
    type: Date,
    optional: true
  },

  // browser
  bName: optionalStr,
  bVersion: optionalStr,
  bMajor: optionalStr,
  bEngine: optionalStr,
  bEngineV: optionalStr,

  ua: optionalStr,

  // os
  osName: optionalStr,
  osVersion: optionalStr,
  osRelease: optionalStr,
  osCodename: optionalStr,
  osInfoSuccess: optionalBoolean,

  // device
  isMobile: optionalBoolean,
  arch: optionalStr,
  vendor: optionalStr,
  model: optionalStr,
  ram: optionalNumber,

  // features
  fontLoaded: optionalBoolean,
  langLoaded: optionalBoolean,
  localStorage: optionalBoolean,

  // tts
  ttsLoaded: optionalBoolean,
  ttsStatus: optionalStr,

  // sw
  swLoaded: optionalBoolean,
  swStatus: optionalStr,
  swActive: optionalBoolean,
  swInstalling: optionalBoolean,
  swWaiting: optionalBoolean,

  // performance
  perfLoaded: optionalBoolean,
  perfStart: optionalNumber,
  perfDuration: optionalNumber,

  // screen
  availWidth: optionalNumber,
  availHeight: optionalNumber,
  width: optionalNumber,
  height: optionalNumber,
  colorDepth: optionalNumber,
  pixelDepth: optionalNumber,
  orientation: optionalStr,

  // graphics
  gl: optionalStr,
  glRenderer: optionalStr,
  glVendor: optionalStr,

  errors: {
    type: Array,
    optional: true
  },
  'errors.$': {
    type: Object,
    blackbox: true
  },
  log: {
    type: Array,
    optional: true,
    max: 500
  },
  'log.$': {
    type: String
  }
}

Diagnostics.api = {}

Diagnostics.api.run = runDiagnostics

Diagnostics.methods = {}

Diagnostics.methods.getAll = {
  name: 'diagnostics.methods.getAll',
  backend: true,
  schema: {
    ids: {
      type: Array,
      optional: true
    },
    'ids.$': String,
    dependencies: {
      type: Array,
      optional: true
    },
    'dependencies.$': String
  },
  run: onServer(function ({ ids }) {
    const query = {}
    if (ids?.length > 0) {
      query._id = { $in: ids }
    }
    const all = Diagnostics.collection().find(query).fetch()

    return { [Diagnostics.name]: all }
  })
}

Diagnostics.methods.send = {
  name: 'diagnostics.methods.send',
  schema: Diagnostics.schema,
  timeInterval: 60 * 1000,
  numRequests: 1,
  isPublic: true,
  run: onServer(function (data) {
    data.createdAt = new Date()
    return Diagnostics.collection().insert(data)
  })
}

Diagnostics.publications = {}
