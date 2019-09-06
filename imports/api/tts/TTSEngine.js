import { i18n } from '../i18n/I18n'

export const TTSEngine = {}

const speechSynth = window.speechSynthesis
const _voices = {}
let _synthVoices

function loadVoicesWhenAvailable () {
  const voices = speechSynth.getVoices()

  if (voices.length !== 0) {
    _synthVoices = voices
  } else {
    setTimeout(function () { loadVoicesWhenAvailable() }, 10)
  }
}

const getVoices = (locale) => {
  if (!global.speechSynthesis) {
    throw new Error('Browser does not support speech synthesis')
  }
  if (_voices[ locale ]) return _voices[ locale ]

  let loadedVoices
  let count = 0
  const secure = 100
  while (!loadedVoices && count < secure) {
    loadedVoices = global.speechSynthesis.getVoices()
  }
  if (!loadedVoices) {
    throw new Error('Could not load voices!')
  }

  _voices[ locale ] = _synthVoices.filter(voice => voice.lang === locale)
  return _voices[ locale ]
}

function playByText (locale, text, { onEnd }) {
  const voices = getVoices(locale)

  // TODO load preference here, e.g. male / female etc.
  // TODO but for now we just use the first occurrence
  const utterance = new global.SpeechSynthesisUtterance()
  utterance.voice = voices[ 0 ]
  utterance.pitch = 1
  utterance.rate = 1
  utterance.voiceURI = 'native'
  utterance.volume = 1
  utterance.rate = 1
  utterance.pitch = 0.8
  utterance.text = text
  utterance.lang = 'de-DE'

  if (onEnd) {
    utterance.onend = onEnd
  }

  speechSynth.cancel()
  speechSynth.speak(utterance)
}

function playById (locale, id, { onEnd }) {
  const translated = i18n.get(id)
  if (!translated || translated === `${locale}.${id}`) {
    throw new Error(`Unknown TTS by id [${id}]`)
  }
  return playByText(locale, translated, { onEnd })
}

TTSEngine.play = function ({ id, text, onEnd }) {
  const locale = i18n.getLocale()
  if (text) {
    return playByText(locale, text, { onEnd })
  } else {
    return playById(locale, id, { onEnd })
  }
}

TTSEngine.stop = function () {
  speechSynth.cancel()
}

loadVoicesWhenAvailable()