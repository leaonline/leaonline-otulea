import { i18n } from '../i18n/I18n'

export const ServerTTS = {}

const TTS_URL = Meteor.settings.public.tts.url
const _requestCache = new Map()

let audio

function postData (url, text) {
  // Default options are marked with *
  return fetch(url, {
    method: 'POST', // *GET, POST, PUT, DELETE, etc.
    mode: 'cors', // no-cors, cors, *same-origin
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    credentials: 'omit', // include, *same-origin, omit
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    },
    redirect: 'follow', // manual, *follow, error
    referrer: 'no-referrer', // no-referrer, *client
    body: 'text=' + encodeURIComponent(text)
  })
    .then(response => console.log(response) || response.json()) // parses JSON response into native JavaScript objects
}

ServerTTS.play = function ({ id, text, onEnd, onError }) {
  const requestText = text || i18n.get(id)
  const cachedUrl = _requestCache.get(requestText)
  if (cachedUrl) {
    return playAudio(cachedUrl, onEnd)
  }

  postData(TTS_URL, requestText)
    .then(data => {
      const { url } = data
      _requestCache.set(requestText, url)
      playAudio(url, onEnd)
    })
    .catch(onError)
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
    const event = new Event('ended');
    audio.dispatchEvent(event)
  }
}

