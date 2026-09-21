/* eslint-env mocha */
import { expect } from 'chai'
import { Meteor } from 'meteor/meteor'
import sinon from 'sinon'
import { ContentServer } from '../../api/remotes/content/ContentServer'
import { RateLimitInventory } from '../../infrastructure/factories/ratelimit/rateLimit'
import { configureCSP } from './configureCSP'
import { Users } from '../../contexts/user/User'
import { Videos } from '../../contexts/Videos/Videos'
import { Diagnostics } from '../../contexts/diagnostics/Diagnostics'
import { Errors } from '../../contexts/errors/Errors'
import { Feedback } from '../../contexts/feedback/Feedback'
import { Legal } from '../../contexts/legal/Legal'
import { Logos } from '../../contexts/logos/Logos'
import { Record } from '../../contexts/record/Record'
import { Response } from '../../contexts/response/Response'

// These imports are the integration boundary: they perform the same
// registrations used by server/main.js, without starting remote synchronization.
import './backendConfig'
import './settings'
import './validation'
import './accounts'
import './contentContexts'
import './error'
import './feedback'
import './legal'
import './logos'
import './Response'
import './Record'
import './diagnostics'
import './Session'
import './videos'
import './rateLimit'
import './queries'
import './patches'

describe('server startup wiring', () => {
  it('registers representative account and content methods', () => {
    expect(Meteor.server.method_handlers[Users.methods.register.name]).to.be.a(
      'function',
    )
    expect(Meteor.server.method_handlers['session.start']).to.be.a('function')
    expect(Meteor.server.method_handlers[Videos.methods.get.name]).to.be.a(
      'function',
    )
    expect(Meteor.server.method_handlers[Diagnostics.methods.send.name]).to.be.a(
      'function',
    )
    expect(Meteor.server.method_handlers[Errors.methods.get.name]).to.be.a(
      'function',
    )
    expect(Meteor.server.method_handlers[Feedback.methods.getAll.name]).to.be.a(
      'function',
    )
    expect(Meteor.server.method_handlers[Legal.methods.get.name]).to.be.a(
      'function',
    )
    expect(Meteor.server.method_handlers[Logos.methods.get.name]).to.be.a(
      'function',
    )
    expect(Meteor.server.method_handlers[Record.methods.getAll.name]).to.be.a(
      'function',
    )
    expect(Meteor.server.method_handlers[Response.methods.getAll.name]).to.be.a(
      'function',
    )
  })

  it('registers representative publications and rate limits', () => {
    expect(
      Meteor.server.publish_handlers[Videos.publications.single.name],
    ).to.be.a('function')
    expect(RateLimitInventory.hasMethod(Users.methods.register.name)).to.equal(
      true,
    )
    expect(RateLimitInventory.hasMethod('session.start')).to.equal(true)
    expect(
      RateLimitInventory.hasPublication(Videos.publications.single.name),
    ).to.equal(true)
    expect(RateLimitInventory.hasAccounts()).to.equal(true)
    expect(RateLimitInventory.isRunning()).to.equal(true)
  })

  it('registers the development corpus query without executing filesystem work', () => {
    if (Meteor.isDevelopment) {
      expect(Meteor.server.method_handlers['query.methods.createCorpus']).to.be.a(
        'function',
      )
    }
  })

  it('resolves the circular error persistence boundary at invocation time', async () => {
    const updateAsync = sinon.stub().resolves(1)
    const collection = {
      findOneAsync: sinon.stub().resolves({ _id: 'existing-error' }),
      updateAsync,
    }
    const collectionStub = sinon.stub(Errors, 'collection').returns(collection)
    try {
      await Errors.methods.create.run.call({ userId: null }, { hash: 'same-error' })
      expect(
        updateAsync.calledWith('existing-error', { $inc: { count: 1 } }),
      ).to.equal(true)
    } finally {
      collectionStub.restore()
    }
  })

  it('keeps administrative export patches side-effect free in dry-run mode', async () => {
    const { alphaUsers } = require('../../patches/alphaUsers')
    const { getResponses } = require('../../patches/getResponses')
    expect(Meteor.settings.patches.alphaUsers.active).to.equal(false)
    expect(Meteor.settings.patches.getResponses.active).to.equal(false)
    expect(
      alphaUsers({
        dryRun: true,
        includeAlphaLevels: false,
        includeCompetencies: false,
      }),
    ).to.equal(undefined)
    expect(await getResponses({ dryRun: true })).to.equal(undefined)
  })

  it('registers only sync-enabled content contexts with the content server', () => {
    const names = ContentServer.contexts().map(({ name }) => name)
    expect(names).to.include.members([
      'alphaLevel',
      'competency',
      'dimension',
      'level',
      'testCycle',
      'thresholds',
      'unit',
      'unitSet',
    ])
  })

  it('wires strict CSP options into the web middleware boundary', async () => {
    const setInlineScriptsAllowed = sinon.stub().resolves()
    const useMiddleware = sinon.spy()
    const middleware = () => {}
    const createMiddleware = sinon.stub().returns(middleware)

    const options = await configureCSP({
      hostUrls: ['https://content.example.test'],
      setInlineScriptsAllowed,
      useMiddleware,
      createMiddleware,
    })

    expect(setInlineScriptsAllowed.calledWith(false)).to.equal(true)
    expect(createMiddleware.calledWith(options)).to.equal(true)
    expect(useMiddleware.calledWith(middleware)).to.equal(true)
    expect(options.contentSecurityPolicy.directives.connectSrc).to.include(
      'https://content.example.test',
    )
  })
})
