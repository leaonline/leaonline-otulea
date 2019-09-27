export const Renderers = {
  text: {
    template: 'textRenderer',
    async load () {
      return import('./text/textRenderer')
    }
  },
  image: {
    template: 'imageRenderer',
    async load () {
      return import('./image/imageRenderer')
    }
  },
  h5p: {
    template: 'h5pRenderer',
    async load () {
      return import('./h5p/h5pRenderer')
    }
  },
  grid: {
    template: 'gridRenderer',
    async load () {
      return import('./grid/gridRenderer')
    }
  }
}