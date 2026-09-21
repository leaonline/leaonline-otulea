/* eslint-env mocha */
import { expect } from 'chai'
import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import sinon from 'sinon'
import { Router } from '../Router'
import { Routes } from '../Routes'

describe('Routes definitions', () => {
  afterEach(() => sinon.restore())

  it('builds stable application paths and protected trigger lists', () => {
    expect(Routes.root.path()).to.equal('/')
    expect(Routes.notFound.path()).to.equal('/seite-nicht-gefunden')
    expect(Routes.fallback.path()).to.equal('*')
    expect(Routes.demo.path()).to.equal('/demo')
    expect(Routes.welcome.path()).to.equal('/willkommen')
    expect(Routes.welcome.path(true)).to.equal('/willkommen?demo=1')
    expect(Routes.legal.path()).to.equal('/rechtliches/:type')
    expect(Routes.legal.path('privacy')).to.equal('/rechtliches/datenschutz')
    expect(Routes.legal.path('custom')).to.equal('/rechtliches/custom')
    expect(Routes.overview.path()).to.equal('/auswahl-aufgaben')
    expect(Routes.story.path()).to.equal(
      '/einleitung/:sessionId/:unitSetId/:unitId',
    )
    expect(Routes.story.path('s', 'set', 'u')).to.equal('/einleitung/s/set/u')
    expect(Routes.unit.path()).to.equal('/aufgabe/:sessionId/:unitId')
    expect(Routes.unit.path('s', 'u')).to.equal('/aufgabe/s/u')
    expect(Routes.complete.path()).to.equal('/ergebnisse/:sessionId')
    expect(Routes.complete.path('s')).to.equal('/ergebnisse/s')
    expect(Routes.logout.path()).to.equal('/abgemeldet')
    expect(Routes.diagnostics.path()).to.equal('/browser-diagnose')
    expect(Routes.overview.triggersEnter()).to.have.length(1)
    expect(Routes.story.triggersEnter()).to.have.length(1)
    expect(Routes.unit.triggersEnter()).to.have.length(1)
    expect(Routes.complete.triggersEnter()).to.have.length(1)
    expect(Routes.root.triggersEnter()).to.have.length(2)
    expect(Routes.internal).to.equal(undefined)
  })

  it('loads each route template without starting a navigation flow', async () => {
    const routes = [
      Routes.notFound,
      Routes.fallback,
      Routes.demo,
      Routes.legal,
      Routes.welcome,
      Routes.overview,
      Routes.story,
      Routes.unit,
      Routes.complete,
      Routes.logout,
      Routes.root,
      Routes.diagnostics,
    ]

    for (const route of routes) {
      try {
        await route.load()
      } catch (e) {
        expect.fail(`failed to load template ${route.template} from route ${route.name}: ${e.message}`)
      }
    }

    expect(Template.notFound).to.be.an('object')
    expect(Template.loading).to.be.an('object')
    expect(Template.legal).to.be.an('object')
    expect(Template.welcome).to.be.an('object')
    expect(Template.overview).to.be.an('object')
    expect(Template.story).to.be.an('object')
    expect(Template.unit).to.be.an('object')
    expect(Template.complete).to.be.an('object')
    expect(Template.logout).to.be.an('object')
    expect(Template.diagnostics).to.be.an('object')
  })

  it('maps route callbacks to their observable destination paths', () => {
    const go = sinon.stub(Router, 'go')

    Routes.notFound.data.next()
    Routes.legal.data.next()
    Routes.welcome.data.next()
    Routes.overview.data.next({ sessionId: 's1', unitId: 'u1' })
    Routes.overview.data.story({
      sessionId: 's1',
      unitSetId: 'set1',
      unitId: 'u1',
    })
    Routes.story.data.next({})
    Routes.story.data.next({ sessionId: 's1' })
    Routes.story.data.next({ sessionId: 's1', unitId: 'u2' })
    Routes.story.data.exit()
    Routes.unit.data.next({})
    Routes.unit.data.next({
      sessionId: 's1',
      unitSetId: 'set1',
      unitId: 'u2',
      hasStory: true,
    })
    Routes.unit.data.next({ sessionId: 's1' })
    Routes.unit.data.next({ sessionId: 's1', unitId: 'u2' })
    Routes.unit.data.next({
      sessionId: 's1',
      unitId: 'u2',
      completed: true,
    })
    Routes.unit.data.exit()
    Routes.unit.data.finish({ sessionId: 's1' })
    Routes.unit.data.finish({})
    Routes.complete.data.end()
    Routes.complete.data.next()
    Routes.complete.data.exit()
    Routes.diagnostics.data.next()

    expect(go.args.map(([path]) => path)).to.deep.equal([
      '/auswahl-aufgaben',
      '/auswahl-aufgaben',
      '/auswahl-aufgaben',
      '/aufgabe/s1/u1',
      '/einleitung/s1/set1/u1',
      '/auswahl-aufgaben',
      '/ergebnisse/s1',
      '/aufgabe/s1/u2',
      '/auswahl-aufgaben',
      '/auswahl-aufgaben',
      '/einleitung/s1/set1/u2',
      '/ergebnisse/s1',
      '/aufgabe/s1/u2',
      '/ergebnisse/s1',
      '/auswahl-aufgaben',
      '/ergebnisse/s1',
      '/auswahl-aufgaben',
      '/abgemeldet',
      '/auswahl-aufgaben',
      '/abgemeldet',
      '/demo',
    ])
  })

  it('executes redirect and account triggers one at a time', () => {
    const go = sinon.stub(Router, 'go')
    sinon.stub(Router, 'location').returns('/current')
    const userId = sinon.stub(Meteor, 'userId').returns(null)
    const user = sinon.stub(Meteor, 'user').returns(null)

    expect(Routes.fallback.triggersEnter()[0]()).to.equal(true)
    expect(go.lastCall.args[0]).to.equal('/seite-nicht-gefunden')
    expect(Routes.demo.triggersEnter()[0]()).to.equal(undefined)
    expect(go.lastCall.args[0]).to.equal('/willkommen?demo=1')

    const [toWelcome, toOverview] = Routes.root.triggersEnter()
    expect(toWelcome()).to.equal(true)
    expect(toOverview()).to.equal(false)
    expect(go.lastCall.args[0]).to.equal('/willkommen')

    userId.returns('user')
    user.returns({ _id: 'user' })
    expect(toWelcome()).to.equal(false)
    expect(toOverview()).to.equal(true)
    expect(go.lastCall.args[0]).to.equal(Routes.overview)
  })

  it('scrolls page routes to the top after route actions', () => {
    const scrollTo = sinon.stub(window, 'scrollTo')
    ;[
      Routes.overview,
      Routes.story,
      Routes.unit,
      Routes.complete,
      Routes.logout,
    ].forEach((route) => route.onAction())
    expect(scrollTo.callCount).to.equal(5)
    expect(scrollTo.alwaysCalledWithExactly(0, 0)).to.equal(true)
  })
})
