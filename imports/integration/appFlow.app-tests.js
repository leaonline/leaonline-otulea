/* eslint-env mocha */
import { expect } from 'chai'
import { Meteor } from 'meteor/meteor'

const methods = {
  reset: '__appTests.flow.reset',
  countSessions: '__appTests.flow.countSessions',
  setResponseAcceptance: '__appTests.flow.setResponseAcceptance',
  inspect: '__appTests.flow.inspect',
  cleanup: '__appTests.flow.cleanup',
}

const fixture = {
  code: 'TST42',
  testCycleId: '__app-test-cycle',
  unitSetId: '__app-test-unit-set',
  unitId: '__app-test-unit',
  itemId: '__app-test-item',
  dimensionId: '__app-test-dimension',
  levelId: '__app-test-level',
  competencyId: '__app-test-competency',
  alphaLevelId: '__app-test-alpha-level',
  thresholdsId: '__app-test-thresholds',
}

if (Meteor.isServer) {
  const { Accounts } = require('meteor/accounts-base')
  const { check } = require('meteor/check')
  const { AlphaLevel } = require('../contexts/AlphaLevel')
  const { Competency } = require('../contexts/Competency')
  const { Dimension } = require('../contexts/Dimension')
  const { Feedback } = require('../contexts/feedback/Feedback')
  const { Level } = require('../contexts/Level')
  const { Record } = require('../contexts/record/Record')
  const { Response } = require('../contexts/response/Response')
  const { Session } = require('../contexts/session/Session')
  const { TestCycle } = require('../contexts/testcycle/TestCycle')
  const { Thresholds } = require('../contexts/thresholds/Thresholds')
  const { Unit } = require('../contexts/Unit')
  const { UnitSet } = require('../contexts/unitSet/UnitSet')

  const removeFixtures = async () => {
    await Promise.all([
      Feedback.collection().rawCollection().deleteMany({
        testCycle: fixture.testCycleId,
      }),
      Record.collection().rawCollection().deleteMany({
        testCycle: fixture.testCycleId,
      }),
      Response.collection().rawCollection().deleteMany({
        unitId: fixture.unitId,
      }),
      Session.collection().rawCollection().deleteMany({
        testCycle: fixture.testCycleId,
      }),
      TestCycle.collection()
        .rawCollection()
        .deleteMany({ _id: fixture.testCycleId }),
      UnitSet.collection()
        .rawCollection()
        .deleteMany({ _id: fixture.unitSetId }),
      Unit.collection().rawCollection().deleteMany({ _id: fixture.unitId }),
      Competency.collection()
        .rawCollection()
        .deleteMany({ _id: fixture.competencyId }),
      AlphaLevel.collection()
        .rawCollection()
        .deleteMany({ _id: fixture.alphaLevelId }),
      Thresholds.collection()
        .rawCollection()
        .deleteMany({ _id: fixture.thresholdsId }),
      Dimension.collection()
        .rawCollection()
        .deleteMany({ _id: fixture.dimensionId }),
      Level.collection().rawCollection().deleteMany({ _id: fixture.levelId }),
      Meteor.users.rawCollection().deleteMany({ username: fixture.code }),
    ])
  }

  Meteor.methods({
    async [methods.reset]() {
      await removeFixtures()
      const userId = await Accounts.createUserAsync({
        username: fixture.code,
        password: fixture.code,
      })
      await Promise.all([
        Dimension.collection().rawCollection().insertOne({
          _id: fixture.dimensionId,
          status: 0,
          shortCode: 'A',
          shortNum: 1,
          title: 'App test dimension',
          icon: 'edit',
          colorType: 0,
          isLegacy: true,
        }),
        Level.collection().rawCollection().insertOne({
          _id: fixture.levelId,
          status: 0,
          level: 1,
          title: 1,
          isLegacy: true,
        }),
        AlphaLevel.collection().rawCollection().insertOne({
          _id: fixture.alphaLevelId,
          status: 0,
          dimension: fixture.dimensionId,
          level: 1,
          shortCode: 'A.1',
          description: 'App test alpha level',
        }),
        Competency.collection().rawCollection().insertOne({
          _id: fixture.competencyId,
          status: 0,
          shortCode: 'A1.01',
          isLegacy: true,
          dimension: fixture.dimensionId,
          level: fixture.alphaLevelId,
          description: 'App test competency',
          descriptionSimple: 'App test competency',
        }),
        Thresholds.collection().rawCollection().insertOne({
          _id: fixture.thresholdsId,
          minCountCompetency: 1,
          thresholdsCompetency: {
            accomplished: 0.8,
            nearAccomplished: 0.6,
            partialAccomplished: 0.3,
            notAccomplished: 0,
          },
          minCountAlphaLevel: 1,
          thresholdsAlphaLevel: {
            accomplished: 0.8,
            notAccomplished: 0,
          },
        }),
        Unit.collection().rawCollection().insertOne({
          _id: fixture.unitId,
          status: 1,
          unitSet: fixture.unitSetId,
          shortCode: 'APP-UNIT',
          pages: [
            {
              content: [
                {
                  type: 'item',
                  subtype: 'choice',
                  contentId: fixture.itemId,
                  width: '12',
                  value: {
                    flavor: 1,
                    shuffle: false,
                    choices: [
                      { text: 'Not selected' },
                      { text: 'Selected response' },
                    ],
                    scoring: [
                      {
                        competency: fixture.competencyId,
                        requires: 1,
                        correctResponse: [1],
                      },
                    ],
                  },
                },
              ],
            },
            {
              content: [
                {
                  type: 'text',
                  subtype: 'text',
                  contentId: '__app-test-finish-text',
                  width: '12',
                  value: 'Ready to finish',
                },
              ],
            },
          ],
        }),
        UnitSet.collection().rawCollection().insertOne({
          _id: fixture.unitSetId,
          status: 1,
          shortCode: 'APP-SET',
          dimension: fixture.dimensionId,
          dimensionShort: 'A',
          level: fixture.levelId,
          field: '__app-test-field',
          units: [fixture.unitId],
          story: [],
        }),
        TestCycle.collection().rawCollection().insertOne({
          _id: fixture.testCycleId,
          shortCode: 'APP-CYCLE',
          field: '__app-test-field',
          dimension: fixture.dimensionId,
          level: fixture.levelId,
          selfAssessment: 'App test assessment',
          progress: 2,
          unitSets: [fixture.unitSetId],
          isLegacy: true,
        }),
      ])
      return { ...fixture, userId }
    },
    async [methods.countSessions]() {
      return Session.collection().countDocuments({
        testCycle: fixture.testCycleId,
      })
    },
    async [methods.setResponseAcceptance](options) {
      check(options, { sessionId: String, accept: Boolean })
      const { sessionId, accept } = options
      return Session.collection().rawCollection().updateOne(
        { _id: sessionId, testCycle: fixture.testCycleId },
        {
          $set: {
            currentUnit: accept
              ? fixture.unitId
              : '__app-test-rejected-unit',
          },
        },
      )
    },
    async [methods.inspect]() {
      const session = await Session.collection().rawCollection().findOne({
        testCycle: fixture.testCycleId,
      })
      const responses = await Response.collection()
        .rawCollection()
        .find({ unitId: fixture.unitId })
        .toArray()
      return { session, responses }
    },
    async [methods.cleanup]() {
      await removeFixtures()
      return true
    },
  })

  describe('[full-app] fixture boundary', () => {
    it('loads only in app-test mode and exposes deterministic fixture methods', () => {
      expect(Meteor.isAppTest).to.equal(true)
      expect(Meteor.server.method_handlers[methods.reset]).to.be.a('function')
      expect(Meteor.server.method_handlers[methods.cleanup]).to.be.a('function')
    })
  })
}

if (Meteor.isClient) {
  const { Session } = require('../contexts/session/Session')
  const { Router } = require('../ui/routing/Router')
  const { Routes } = require('../ui/routing/Routes')

  const call = (name, args) =>
    args === undefined ? Meteor.callAsync(name) : Meteor.callAsync(name, args)
  const logout = () =>
    new Promise((resolve) => {
      if (!Meteor.userId()) return resolve()
      Meteor.logout(resolve)
    })
  const login = (code) =>
    new Promise((resolve, reject) => {
      Meteor.loginWithPassword(code, code, (error) =>
        error ? reject(error) : resolve(),
      )
    })
  const waitFor = (predicate, description, timeout = 10000) =>
    new Promise((resolve, reject) => {
      const started = Date.now()
      const poll = () => {
        let result
        try {
          result = predicate()
        } catch (error) {
          reject(error)
          return
        }
        if (result) return resolve(result)
        if (Date.now() - started >= timeout) {
          reject(new Error(`Timed out waiting for ${description}`))
          return
        }
        setTimeout(poll, 20)
      }
      poll()
    })
  const click = async (selector, description = selector) => {
    const element = await waitFor(
      () => document.querySelector(selector),
      description,
    )
    element.click()
    return element
  }
  const normalizedText = (selector) =>
    document.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim()

  describe('[full-app] normal-browser routing/session safety net', function () {
    this.timeout(30000)

    beforeEach(async () => {
      await logout()
      await call(methods.reset)
    })

    afterEach(async () => {
      await logout()
      await call(methods.cleanup)
    })

    it('rejects an unauthenticated session mutation without inserting', async () => {
      expect(await call(methods.countSessions)).to.equal(0)
      let error
      try {
        await call(Session.methods.start.name, {
          testCycleId: fixture.testCycleId,
        })
      } catch (runtimeError) {
        error = runtimeError
      }
      expect(error).to.exist
      expect(error.error).to.equal('errors.permissionDenied')
      expect(await call(methods.countSessions)).to.equal(0)
    })

    it('completes a real item through overview, durable page navigation and finish UI', async () => {
      await login(fixture.code)
      Router.go(Routes.overview)
      await waitFor(
        () => Router.current()?.route?.name === Routes.overview.key,
        'overview route',
      )

      await click(
        `.lea-dimension-button[data-dimension="${fixture.dimensionId}"]`,
        'fixture dimension button',
      )
      await click(
        `.lea-level-button[data-level="${fixture.levelId}"]`,
        'fixture level button',
      )
      await click('.lea-overview-confirm-button', 'session start button')

      await waitFor(
        () =>
          Router.current()?.route?.name === Routes.unit.key &&
          document.querySelector('.choice-entry[data-index="1"]'),
        'rendered unit choice',
      )
      expect(normalizedText('.trapezoid')).to.equal('1 / 2')
      await click('.choice-entry[data-index="1"]', 'real item response')

      const started = await call(methods.inspect)
      expect(started.session).to.include({
        testCycle: fixture.testCycleId,
        currentUnit: fixture.unitId,
        progress: 0,
      })
      expect(started.responses).to.deep.equal([])

      // Force the real response method to reject once. The page adapter must
      // release the renderer wait state without applying the destination page.
      await call(methods.setResponseAcceptance, {
        sessionId: started.session._id,
        accept: false,
      })
      await click('.lea-pagenav-button[data-action="next"]', 'next page button')
      await waitFor(
        () => !document.querySelector('.lea-pagenav-button[data-action="next"]'),
        'durable response wait state',
      )
      await waitFor(
        () => document.querySelector('.lea-pagenav-button[data-action="next"]'),
        'rejected response wait-state release',
      )
      expect(normalizedText('.trapezoid')).to.equal('1 / 2')
      expect((await call(methods.inspect)).responses).to.deep.equal([])

      await call(methods.setResponseAcceptance, {
        sessionId: started.session._id,
        accept: true,
      })
      await click('.lea-pagenav-button[data-action="next"]', 'retry next page')
      await waitFor(
        () =>
          normalizedText('.trapezoid') === '2 / 2' &&
          document.querySelector('.lea-pagenav-finish-button'),
        'second unit page',
      )

      const afterRetry = await call(methods.inspect)
      expect(afterRetry.responses).to.have.length(1)
      expect(afterRetry.responses[0]).to.include({
        sessionId: started.session._id,
        unitId: fixture.unitId,
        contentId: fixture.itemId,
        page: 0,
      })
      expect(afterRetry.responses[0].responses).to.deep.equal(['1'])
      expect(afterRetry.responses[0].failed).to.equal(undefined)
      expect(afterRetry.responses[0].scores).to.have.length(1)

      await click('.lea-pagenav-finish-button', 'finish unit button')
      await waitFor(
        () =>
          Router.current()?.route?.name === Routes.complete.key &&
          document.querySelector('.lea-complete-container'),
        'completion route and UI',
      )
      await waitFor(
        () => document.querySelector('.lea-showresults-forward-button'),
        'successful completion results',
        15000,
      )

      const persisted = await call(methods.inspect)
      expect(persisted.session.currentUnit).to.equal(null)
      expect(persisted.session.progress).to.equal(2)
      expect(persisted.session.completedAt).to.be.a('date')
      expect(persisted.responses).to.have.length(1)
      expect(persisted.responses[0].responses).to.deep.equal(['1'])
      expect(persisted.responses[0].scores).to.have.length(1)
    })
  })
}
