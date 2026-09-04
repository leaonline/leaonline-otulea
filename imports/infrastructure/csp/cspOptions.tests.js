/* eslint-env mocha */
import { expect } from 'chai'
import { createCSPOptions } from './cspOptions'

describe(createCSPOptions.name, () => {
  it('allows dynamic imports but blocks arbitrary inline scripts in production', () => {
    const options = createCSPOptions([], {
      absoluteUrl: 'https://lea.example',
      isDevelopment: false,
    })
    const { scriptSrc } = options.contentSecurityPolicy.directives

    expect(scriptSrc).to.include("'self'")
    expect(scriptSrc).to.include("'unsafe-eval'")
    expect(scriptSrc).not.to.include("'unsafe-inline'")
    expect(scriptSrc.some(source => source.startsWith("'sha256-"))).to.equal(false)
  })

  it('keeps the localhost development fallback', () => {
    const options = createCSPOptions([], {
      absoluteUrl: 'http://localhost:3000',
      isDevelopment: true,
    })

    expect(options.contentSecurityPolicy.directives.scriptSrc)
      .to.include("'unsafe-inline'")
  })
})
