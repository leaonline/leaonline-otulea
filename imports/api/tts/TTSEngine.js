import { i18n } from '../i18n/I18n'

export const TTSEngine = {}

const speechSynth = window.speechSynthesis
const _voices = {}
let _synthVoices

function loadVoicesWhenAvailable () {
  return new Promise(resolve=> {
    window.speechSynthesis.onvoiceschanged = resolve
    window.speechSynthesis.getVoices()
  })
    .then(()=> {
      console.log('voices loaded', window.speechSynthesis)
      _synthVoices = speechSynth.getVoices();
    })
    .catch(e => console.error(e))
}

const getVoices = (locale) => {
  if (!global.speechSynthesis) {
    throw new Error('Browser does not support speech synthesis')
  }
  if (_voices[ locale ]) return _voices[ locale ]

  console.log(_synthVoices)
  _voices[ locale ] = _synthVoices.filter(voice => voice.lang === locale)
  return _voices[ locale ]
}

function playByText (locale, text) {
  const voices = getVoices(locale)

  // TODO load preference here, e.g. male / female etc.
  // TODO but for now we just use the first occurrence
  const utterance = new global.SpeechSynthesisUtterance(text)
  utterance.voice = voices[ 0 ]
  console.log(voices[ 0 ])
  utterance.pitch = 1
  utterance.rate = 1
  speechSynth.speak(utterance)
}

function playById (locale, id) {
  const translated = i18n.get(id)
  if (!translated || translated === `${locale}.${id}`) {
    throw new Error(`Unknown TTS by id [${id}]`)
  }
  return playByText(locale, translated)
}

TTSEngine.play = function ({ id, text }) {
  const locale = i18n.getLocale()
  if (text) {
    return playByText(locale, text)
  } else {
    return playById(locale, id)
  }
}

loadVoicesWhenAvailable()