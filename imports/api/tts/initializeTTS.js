import { Meteor } from 'meteor/meteor'
import { SHA256 } from 'meteor/sha'
import { sendError } from '../../contexts/errors/api/sendError'
import { fatal } from '../../ui/components/fatal/fatal'
import { makeGloballyAvailable } from '../../utils/makeGloballyAvailable'
import { createTTSInitializer } from './createTTSInitializer'

makeGloballyAvailable({ SHA256 })
const MAX_SERVER_RETRIES = Meteor.settings.public.tts.maxRetries ?? -1
const TTS_URL = Meteor.settings.public.tts.url

export const initializeTTS = createTTSInitializer({
  loadEngine: async () => {
    const { TTSEngine } = await import('../../api/tts/TTSEngine')
    return TTSEngine
  },
  hash: SHA256,
  url: TTS_URL,
  maxServerRetries: MAX_SERVER_RETRIES,
  createError: (details) =>
    new Meteor.Error('tts.failed', 'tts.initFailed', details),
  fatal,
  sendError,
})
