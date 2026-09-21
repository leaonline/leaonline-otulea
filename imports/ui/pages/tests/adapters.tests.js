/* eslint-env mocha */
import { expect } from 'chai'
import { Blaze } from 'meteor/blaze'
import { Template } from 'meteor/templating'
import { Router } from '../../routing/Router'
import { Routes } from '../../routing/Routes'
import { initializeTTS } from '../../../api/tts/initializeTTS'
import { RouteHelpers } from '../../../startup/client/routeHelpers'
import '../../../startup/client/routes'
import '../../../startup/client/testDebug'
import '../../templates/initDependencies'
import '../../layout/footer/footer'
import '../complete/complete'
import '../diagnostics/diagnostics'
import '../internal/internal'
import internalLanguage from '../internal/i18n/lang'
import '../legal/legal'
import legalLanguage from '../legal/i18n/legalLanguage'
import '../login/login'
import '../logout/logout'
import '../notfound/notFound'
import '../overview/overview'
import '../redirecting/redirecting'
import '../story/story'
import '../unit/unit'
import '../welcome/welcome'

describe('Blaze page adapters', () => {
  it('registers every extracted page with Blaze', () => {
    expect(Template.complete).to.be.an('object')
    expect(Template.diagnostics).to.be.an('object')
    expect(Template.footer).to.be.an('object')
    expect(Template.internal).to.be.an('object')
    expect(Template.legal).to.be.an('object')
    expect(Template.login).to.be.an('object')
    expect(Template.logout).to.be.an('object')
    expect(Template.notFound).to.be.an('object')
    expect(Template.overview).to.be.an('object')
    expect(Template.redirecting).to.be.an('object')
    expect(Template.story).to.be.an('object')
    expect(Template.unit).to.be.an('object')
    expect(Template.welcome).to.be.an('object')
  })

  it('retains dependency, router and TTS public adapter shapes', () => {
    expect(Blaze.TemplateInstance.prototype.initDependencies).to.be.a('function')
    expect(Router.register).to.be.a('function')
    expect(Router.queryParam).to.be.a('function')
    expect(initializeTTS).to.be.a('function')
  })

  it('registers route and language startup adapters', () => {
    expect(RouteHelpers.routeDef('welcome')).to.equal(Routes.welcome)
    expect(Router.has(Routes.welcome.path())).to.equal(Routes.welcome)
    expect(global.isDebugUser).to.be.a('function')
    expect(internalLanguage.de).to.be.a('function')
    expect(legalLanguage.de).to.be.a('function')
  })
})
