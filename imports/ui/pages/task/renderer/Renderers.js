export const Renderers = {
  text: {
    template: 'textRenderer',
    async load () {
      return import('../renderer/text/textRenderer')
    }
  },
  image: {
    template: 'imageRenderer',
    async load () {
      return import('../renderer/image/imageRenderer')
    }
  },
  h5p: {
    template: 'h5pRenderer',
    async load () {
      return import('../renderer/h5p/h5pRenderer')
    }
  }
}