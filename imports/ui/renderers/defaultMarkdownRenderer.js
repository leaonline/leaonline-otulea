import { Renderer } from 'marked'

export const defaultMarkdownRenderer = () => {
  return new DefaultRenderer()
}

class DefaultRenderer extends Renderer {
  heading ({ tokens }) {
    const text = this.parser.parseInline(tokens);
    return `<span class="lea-text-bold">${text}</span>`
  }

  paragraph ({ tokens } /*, level */) {
    const text = this.parser.parseInline(tokens);
    return `<p class="lea-text">${text}</p>`
  }

  strong ({ tokens }) {
    const text = this.parser.parseInline(tokens);
    return `<span class="lea-text-bold">${text}</span>`
  }


}
