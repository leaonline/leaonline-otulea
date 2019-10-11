import { HTTP } from 'meteor/http'
import { i18n } from '../i18n/I18n'

export const ServerTTS = {}

const TTS_URL = Meteor.settings.public.tts.url
const _requestCache = new Map()

let audio


ServerTTS.play = function ({ id, text, onEnd, onError }) {
  const requestText = text || i18n.get(id)
  const cachedUrl = _requestCache.get(requestText)
  if (cachedUrl) {
    return playAudio(cachedUrl, onEnd)
  }

  const options = {
   params: {text: requestText},
   headers: {
     'Accept': 'application/json, text/plain, */*',
     'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
   }
  }

  HTTP.post(TTS_URL, options, (err, res) => {
    console.log(err, res)
    if (err) {
      return onError(err)
    } else {
      const { url } = res.data
      console.log(url)
      _requestCache.set(requestText, url)
      playAudio(url, onEnd)
    }
  })
}

function playAudio (url, onEnd) {
  ServerTTS.stop()
  audio = new Audio(url)
  audio.onended = onEnd
  audio.play()
}

ServerTTS.stop = function () {
  if (audio) {
    audio.pause()
    const event = new Event('ended')
    audio.dispatchEvent(event)
  }
}
