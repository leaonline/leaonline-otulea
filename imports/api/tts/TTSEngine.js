import { BrowserTTS } from './BrowserTTS'
import { ServerTTS } from './ServerTTS'

export const TTSEngine = {}

TTSEngine.mode = 'server'

TTSEngine.play = function ({ id, text, onEnd }) {
  const fallback = () => {
    BrowserTTS.play({ id, text, onEnd })
  }
  if (TTSEngine.mode === 'server') {
    ServerTTS.play({ id, text, onEnd, onError: fallback })
  } else {
    fallback()
  }
}

TTSEngine.stop = function () {
  if (TTSEngine.mode === 'server') {
    ServerTTS.stop()
  } else {
    BrowserTTS.stop()
  }
}
