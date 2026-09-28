import { Blaze } from 'meteor/blaze'
import { Template } from 'meteor/templating'
import { Random } from 'meteor/random'

export const createTTS = (tokens, options) => {
  let text

  if (Array.isArray(tokens)) {
    text = tokens.reduce((acc, token) => {
      if (typeof token.text === 'string') {
        return acc + token.text
      }
      return acc
    }, '')
  }

  if (typeof tokens === 'string') {
    text = tokens
  }

  if (!text) {
    console.warn('Could not create TTS text for tokens', tokens)
    return ''
  }

  const ttsId = `markdown-tts-${Random.id(6)}`
  setTimeout(() => {
    const parent = document.querySelector(`#${ttsId}`)
    Blaze.renderWithData(
      Template.soundbutton,
      {
        text,
        outline: true,
        sm: true,
        type: options.color ?? options.type ?? 'primary',
        class: 'border-0 me-2',
      },
      parent,
    )
  }, 300)
  return `<span id="${ttsId}"></span>`
}
