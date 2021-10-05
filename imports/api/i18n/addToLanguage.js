import { i18n } from './I18n'

export const addToLanguage = async options => {
  const locale = i18n.getLocale()
  const importFn = options[locale]

  if (!importFn) return

  const definitions = await importFn()
  return i18n.set(locale, definitions)
}
