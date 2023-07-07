import { marked } from 'marked'

export const LeaMarkdown = {}

const renderers = new Map()
const defaultOptions = {
  mangle: false,
  breaks: true,
  gfm: true,
  async: true,
  headerIds: false
}

LeaMarkdown.addRenderer = (name, impl) => {
  renderers.set(name, impl)
}

LeaMarkdown.parse = async ({ input, options, renderer }) => {
  const mergedOptions = { ...defaultOptions, ...options }
  const usedRenderer = renderers.get(renderer)

  if (usedRenderer) {
    mergedOptions.renderer = usedRenderer
  }

  return marked.parse(input, mergedOptions)
}
