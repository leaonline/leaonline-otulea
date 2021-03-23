/* global __meteor_runtime_config__ */
import { Meteor } from 'meteor/meteor'
import crypto from 'crypto'
import { WebApp } from 'meteor/webapp'
import { Autoupdate } from 'meteor/autoupdate'

export function helmetOptions () {
  const domain = Meteor.absoluteUrl().replace(/http(s)*:\/\//, '').replace(/\/$/, '')
  const s = Meteor.absoluteUrl().match(/(?!=http)s(?=:\/\/)/) ? 's' : ''
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
      browserSniff: false,
      blockAllMixedContent: true,
      directives: {
        childSrc: ["'self'"],
        connectSrc: [
          "'self'",
          `http${s}://${domain}`,
          `ws${s}://${domain}`
        ],
        defaultSrc: ["'self'"],
        fontSrc: [
          "'self'",
          'data:'
        ],
        formAction: ["'self'"],
        frameAncestors: ["'self'"],
        frameSrc: ['*'],
        imgSrc: [
          "'self'",
          'data:',
          'blob:'
        ],
        manifestSrc: ["'self'"],
        mediaSrc: ["'self'"],
        objectSrc: ["'self'"],
        sandbox: [
          'allow-same-origin',
          'allow-orientation-lock',
          'allow-pointer-lock',
          'allow-popups',
          'allow-scripts',
          'allow-forms',
          'allow-modals',
          //'allow-presentation',
          //'allow-top-navigation',
          'allow-popups-to-escape-sandbox'
        ],
        scriptSrc: [
          "'self'",
          "'unsafe-eval'",
          `'sha256-${runtimeConfigHash}'`
        ],
        styleSrc: ["'self'", "'unsafe-inline'"],
        workerSrc: ["'self'", 'blob:']
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
      action: 'sameorigin'
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

  return opt
}