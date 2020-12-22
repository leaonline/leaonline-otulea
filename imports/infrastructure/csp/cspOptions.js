/* global __meteor_runtime_config__ */
import { Meteor } from 'meteor/meteor'
import { check } from 'meteor/check'
import crypto from 'crypto'
import { WebApp } from 'meteor/webapp'
import { Autoupdate } from 'meteor/autoupdate'

const self = '\'self\''
const data = 'data:'

const getConnectSrc = url => {
  const domain = url.replace(/http(s)*:\/\//, '').replace(/\/$/, '')
  const s = url.match(/(?!=http)s(?=:\/\/)/) ? 's' : ''
  const connectSrc = [
    self,
    `http${s}://${domain}`,
    `ws${s}://${domain}`
  ]
  
  return { domain, s, connectSrc }
}

export function helmetOptions (externalHostUrls = [], print) {
  const { s, connectSrc } = getConnectSrc(Meteor.absoluteUrl())
  const connectSources = connectSrc.concat(externalHostUrls)
  const imageSources = [self, data, 'blob:'].concat(externalHostUrls)
  check(connectSources, [String])

  const runtimeConfig = Object.assign(__meteor_runtime_config__, Autoupdate, { accountsConfigCalled: true })

  // add missing client versions to runtimeconfig
  Object.keys(WebApp.clientPrograms).forEach(arch => {
    __meteor_runtime_config__.versions[arch] = {
      version: Autoupdate.autoupdateVersion || WebApp.clientPrograms[arch].version(),
      versionRefreshable: Autoupdate.autoupdateVersion || WebApp.clientPrograms[arch].versionRefreshable(),
      versionNonRefreshable: Autoupdate.autoupdateVersion || WebApp.clientPrograms[arch].versionNonRefreshable()
    }
  })

  __meteor_runtime_config__.isModern = true
  __meteor_runtime_config__.accountsConfigCalled = true // may vary, depending on your congfig

  const runtimeConfigScript = `__meteor_runtime_config__ = JSON.parse(decodeURIComponent("${encodeURIComponent(JSON.stringify(runtimeConfig))}"))`
  const runtimeConfigHash = crypto.createHash('sha256').update(runtimeConfigScript).digest('base64')

  const opt = {
    contentSecurityPolicy: {
      blockAllMixedContent: true,
      directives: {
        defaultSrc: [self],
        scriptSrc: [
          self,
          "'unsafe-eval'",
          `'sha256-${runtimeConfigHash}'`
        ],
        childSrc: [self],
        connectSrc: connectSources,
        fontSrc: [self, data],
        formAction: [self],
        frameAncestors: [self],
        frameSrc: ['*'],
        imgSrc: imageSources,
        manifestSrc: [self],
        mediaSrc: [self],
        objectSrc: [self],
        sandbox: [
          'allow-same-origin',
          'allow-scripts',
          'allow-forms',
          //'allow-popups',
          //'allow-popups-to-escape-sandbox'
          'allow-modals'
        ],
        styleSrc: [self, "'unsafe-inline'"],
        workerSrc: [self, 'blob:']
      }
    },
    strictTransportSecurity: {
      maxAge: 15552000,
      includeSubDomains: true,
      preload: false
    },
    referrerPolicy: {
      policy: 'no-referrer'
    },
    expectCt: {
      enforce: true,
      maxAge: 604800
    },
    frameguard: {
      action: 'deny'
    },
    dnsPrefetchControl: {
      allow: false
    },
    permittedCrossDomainPolicies: {
      permittedPolicies: 'none'
    }
  }

  if (s === '') {
    delete opt.contentSecurityPolicy.directives.blockAllMixedContent
    opt.contentSecurityPolicy.directives.scriptSrc = ['\'self\'', '\'unsafe-eval\'', '\'unsafe-inline\'']
  }

  if (print) {
    console.info(opt)
  }
  return opt
}