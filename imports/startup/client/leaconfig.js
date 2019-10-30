import {LeaCoreLib} from 'meteor/leaonline:corelib'
import { i18n } from '../../api/i18n/I18n'

Meteor.startup(() => {
  LeaCoreLib.i18n.load(i18n)
  LeaCoreLib.ttsEngine.configure({ ttsUrl: Meteor.settings.public.tts.url })
})