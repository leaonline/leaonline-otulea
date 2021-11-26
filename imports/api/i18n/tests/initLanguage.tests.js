/* eslint-env mocha */
import { initLanguage } from '../initLanguage'
import { i18n } from '../I18n'
import { expect } from 'chai'

describe(initLanguage.name, function () {
  it('initializes all language defaults', async function () {
    // before init
    expect(i18n.get('common.yes')).to.equal('common.yes')
    const loaded = await initLanguage()
    expect(loaded).to.equal(i18n)

    // i18n loaded, default lang is 'de'
    expect(i18n.get('common.yes')).to.equal('Ja')
  })
  it('registered a global TemplateHelper')
})
