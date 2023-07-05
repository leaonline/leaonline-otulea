import { Renderer } from 'marked'

export const defaultMarkdownRenderer = () => {
  return new DefaultRenderer()
}

class DefaultRenderer extends Renderer {
  constructor (options) {
    super(options)
  }

  heading (text) {
    return `<span class="lea-text-bold">${text}</span>`
  }

  paragraph (text /*, level */) {
    return `<p class="lea-text">${text}</p>`
  }

  strong (text) {
    return `<span class="lea-text-bold">${text}</span>`
  }
}
