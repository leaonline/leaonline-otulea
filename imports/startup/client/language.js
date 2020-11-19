import { Template } from 'meteor/templating'
import { i18n } from '../../api/i18n/I18n'

// also register a language helper for templates

Template.registerHelper('i18n', function (...args) {
  args.pop()
  return i18n.get(...args)
})

export const initLanguage = async () => {
  const I18N = (await import('meteor/ostrio:i18n')).default
  const settings = (await import('../../../resources/i18n/i18n_config')).default
  const de = (await import('../../../resources/i18n/i18n_de')).default
  const { i18n } = await import('../../api/i18n/I18n')
  const config = { settings, de }
  const i18nProvider = new I18N({ i18n: config })

  i18n.load({
    get: i18nProvider.get,
    set: (locale, definitions) => i18nProvider.addl10n({ [locale]: definitions }),
    getLocale: () => i18nProvider.currentLocale.get(),
    thisContext: i18nProvider
  })

  document.documentElement.setAttribute('lang', 'de')
  console.info('[Language]: loaded')
}
