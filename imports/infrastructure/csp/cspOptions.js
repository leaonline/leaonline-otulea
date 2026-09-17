import { Meteor } from 'meteor/meteor'
import { check } from 'meteor/check'

const self = "'self'"
const data = 'data:'
const blob = 'blob:'
const unsafeEval = "'unsafe-eval'"
const unsafeInline = "'unsafe-inline'"

/**
 * Creates a helmet-compatible CSP-configuration
 * @param externalHostUrls {Array|undefined} Optional array with allowed hosts
 * @return {Object} a CSP configuration object
 */
export function createCSPOptions(externalHostUrls = [], environment = {}) {
  const {
    absoluteUrl = Meteor.absoluteUrl(),
    isDevelopment = Meteor.isDevelopment,
  } = environment

  // get the default connect source for our current domain
  const { usesHttps, connectSrc } = getConnectSrc(absoluteUrl)

  const opt = {
    contentSecurityPolicy: {
      blockAllMixedContent: true,
      directives: {
        defaultSrc: [self],
        scriptSrc: [
          self,
          // Remove / comment out unsafeEval if you do not use dynamic imports
          // to tighten security. However, if you use dynamic imports this line
          // must be kept in order to make them work.
          unsafeEval,
        ],
        childSrc: [self],
        // If you have external apps, that should be allowed as sources for
        // connections or images, your should add them here
        // Call helmetOptions() without args if you have no external sources
        // Note, that this is just an example and you may configure this to your needs
        connectSrc: connectSrc.concat(externalHostUrls),
        fontSrc: [self, data],
        formAction: [self],
        frameAncestors: [self],
        frameSrc: ['*'],
        // This is an example to show, that we can define to show images only
        // from our self, browser data/blob and a defined set of hosts.
        // Configure to your needs.
        imgSrc: [self, data, 'blob:'].concat(externalHostUrls),
        manifestSrc: [self],
        mediaSrc: [self, data, 'blob:'].concat(externalHostUrls),
        objectSrc: [self],
        // these are just examples, configure to your needs, see
        // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/sandbox
        sandbox: [
          // allow-downloads-without-user-activation // experimental
          'allow-forms',
          'allow-modals',
          // 'allow-orientation-lock',
          // 'allow-pointer-lock',
          // 'allow-popups',
          // 'allow-popups-to-escape-sandbox',
          // 'allow-presentation',
          'allow-same-origin',
          'allow-scripts',
          // 'allow-storage-access-by-user-activation ', // experimental
          // 'allow-top-navigation',
          // 'allow-top-navigation-by-user-activation'
        ],
        styleSrc: [self, unsafeInline],
        workerSrc: [self, blob],
      },
    },
    strictTransportSecurity: {
      maxAge: 15552000,
      includeSubDomains: true,
      preload: false,
    },
    referrerPolicy: {
      policy: 'no-referrer',
    },
    expectCt: {
      enforce: true,
      maxAge: 604800,
    },
    frameguard: {
      action: 'sameorigin',
    },
    dnsPrefetchControl: {
      allow: false,
    },
    permittedCrossDomainPolicies: {
      permittedPolicies: 'none',
    },
    hidePoweredBy: true,
  }

  // We assume, that we are working on a localhost when there is no https
  // connection available.
  // Run your project with --production to exercise the strict script policy.
  if (!usesHttps && isDevelopment) {
    delete opt.contentSecurityPolicy.directives.blockAllMixedContent
    opt.contentSecurityPolicy.directives.scriptSrc = [
      self,
      unsafeEval,
      unsafeInline,
    ]
  }

  return opt
}

/** @private Transforms a given url to a valid connect-src */
const getConnectSrc = (url) => {
  check(url, String)
  const domain = url.replace(/http(s)*:\/\//, '').replace(/\/$/, '')
  const s = url.match(/(?!=http)s(?=:\/\/)/) ? 's' : ''
  const usesHttps = s.length > 0
  const connectSrc = [self, `http${s}://${domain}`, `ws${s}://${domain}`]

  return { domain, usesHttps, connectSrc }
}
