import { ReactiveVar } from 'meteor/reactive-var'
import { TaskRenderers } from './TaskRenderers'
import { Markdown } from 'meteor/leaonline:corelib/markdown/Markdown'
import { createTTS } from './defaultMarkdownRenderer'

const renderersLoaded = new ReactiveVar()

export const initTaskRenderers = () => {
  if (renderersLoaded.get()) {
    return renderersLoaded
  }

  Markdown.setTTSRenderer(createTTS)

  TaskRenderers.init({
    markdown: {
      renderer: async (data) => {
        return Markdown.render(data)
      },
    },
  })
    .then(() => renderersLoaded.set(true))
    .catch((e) => console.error(e))

  return renderersLoaded
}
