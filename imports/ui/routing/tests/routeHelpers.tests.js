/* eslint-env mocha */
import { expect } from 'chai'
import sinon from 'sinon'
import { Router } from '../Router'
import { Routes } from '../Routes'
import { getQueryParam } from '../getQueryParam'
import { gotoRoute } from '../gotoRoute'
import { backRoute, resolveRoute } from '../routeHelpers'
import { setQueryParam } from '../setQueryParam'

describe('routing helpers', () => {
  afterEach(() => sinon.restore())

  it('resolves known routes and falls back for unknown keys', () => {
    expect(resolveRoute('unit', 'session', 'unit')).to.equal(
      Routes.unit.path('session', 'unit'),
    )
    expect(resolveRoute('missing')).to.equal('/seite-nicht-gefunden')
  })

  it('delegates navigation and query changes through the router facade', () => {
    const go = sinon.stub(Router, 'go').returns('navigated')
    const queryParam = sinon.stub(Router, 'queryParam').returns('changed')

    expect(gotoRoute(Routes.complete, 'session')).to.equal('navigated')
    expect(go.calledWith('/ergebnisse/session')).to.equal(true)
    expect(setQueryParam({ page: 2 })).to.equal('changed')
    expect(queryParam.calledWith({ page: 2 })).to.equal(true)
  })

  it('reads browser query parameters and the previous route', () => {
    const original = window.location.href
    window.history.replaceState({}, '', '/current?debug=1')
    sinon.stub(Router, 'current').returns({ oldRoute: { path: '/previous' } })

    expect(getQueryParam('debug')).to.equal('1')
    expect(getQueryParam('missing')).to.equal(null)
    expect(backRoute()).to.equal('/previous')
    window.history.replaceState({}, '', original)
  })
})
