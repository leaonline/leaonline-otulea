import I18N from 'meteor/ostrio:i18n'

let _translator

export const i18n = {}

i18n.load = function (config) {
  _translator = new I18N({ i18n: config })
}

i18n.get = function (...params) {
  return _translator && _translator.get()
}

i18n.set = function (lang, options) {
  return _translator.addl10n({ [ lang ]: options })
}
