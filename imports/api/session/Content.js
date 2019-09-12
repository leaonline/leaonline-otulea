export const Content = {}

Content.types = {
  text: {
    name: 'text',
    subTypes: {
      text: 'text',
      quote: 'quote'
    }
  },
  media: {
    name: 'media',
    subTypes: {
      image: 'image',
      video: 'video'
    }
  },
  interaction: {
    name: 'interaction',
    subTypes: {
      h5p: 'h5p',
      html: 'html'
    }
  }
}

Content.schema = {
  type: String,
  subtype: String,
  value: String,
  class: {
    type: String,
    optional: true
  }
}