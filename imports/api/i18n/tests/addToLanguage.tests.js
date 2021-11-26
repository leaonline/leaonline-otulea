/* eslint-env mocha */
import { addToLanguage } from '../addToLanguage'
import { Random } from 'meteor/random'
import { expect } from 'chai'
import { i18n } from '../I18n'
import { restoreAll, stub } from '../../../../tests/helpers.tests'

describe(addToLanguage.name, function () {
  afterEach(function () {
    restoreAll()
  })
  it('skips if the current locale is not found',async function () {
    stub(i18n, 'getLocale', () => Random.id())
    stub(i18n, 'set', () => expect.fail('should not be reached'))

    const added = await addToLanguage({})
    expect(added).to.equal(false)
  })
  it('skips if the loaded module contains no definitions', async function () {
    const locale = Random.id(6)
    stub(i18n, 'getLocale', () => locale)
    stub(i18n, 'set', () => expect.fail('should not be reached'))

    ;[undefined, null, '', 1].forEach(async definitions => {
      let called = false
      const added = await addToLanguage({
        [locale]: async () => {
          called = true
          return definitions
        }
      })
      expect(called).to.equal(true)
      expect(added).to.equal(false)
    })
  })
  it('loads the current locale and adds it to the i18n', async function () {
    const locale = Random.id(6)
    stub(i18n, 'getLocale', () => locale)

    let setCalled
    const definitions = { foo: 'bar '}

    stub(i18n, 'set', (loc, defs) => {
      expect(loc).to.equal(locale)
      expect(defs).to.deep.equal(definitions)
      setCalled = true
    })

    ;[
      { [locale]: async () => definitions }, // object
      { [locale]: async () => ({ default: definitions }) } // module
    ].forEach(async languages => {
      setCalled = false
      const added = await addToLanguage(languages)
      expect(added).to.equal(true)
      expect(setCalled).to.equal(true)
    })
  })
})