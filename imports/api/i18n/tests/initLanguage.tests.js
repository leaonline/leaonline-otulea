/* eslint-env mocha */
import { Template } from 'meteor/templating'
import { initLanguage } from '../initLanguage'
import { i18n } from '../I18n'
import { expect } from 'chai'
import { restoreAll, stub } from '../../../../tests/helpers.tests'

describe(initLanguage.name, function () {
  afterEach(() => {
    restoreAll()
  })
  it('is not initialized by default', () => {
    expect(i18n.get('common.yes')).to.equal('common.yes')
  })
  it('initializes all language defaults', async function () {
    const loaded = await initLanguage()
    expect(loaded).to.equal(i18n)

    // i18n loaded, default lang is 'de'
    expect(i18n.get('common.yes')).to.equal('Ja')
    expect(loaded.get('common.yes')).to.equal('Ja')

    // dynamically add attributes
    expect(loaded.get('foo.bar')).to.equal('de.foo.bar')
    loaded.set(loaded.getLocale(), { foo: { bar: 'moo' } })
    expect(loaded.get('foo.bar')).to.equal('moo')
  })
  it('registered a global TemplateHelper', async () => {
    const helpers = []
    stub(Template, 'registerHelper', (name, fn) => {
      console.debug(name)
      helpers.push({ name, fn })
    })
    await initLanguage()

    expect(helpers[0].name).to.equal('___i18n___')
    expect(helpers[1].name).to.equal('___i18nSettings___')
    expect(helpers[2].name).to.equal('i18n')

    const fn = helpers[2].fn
    expect(fn('common.yes', () => {})).to.equal('Ja')
  })
})
