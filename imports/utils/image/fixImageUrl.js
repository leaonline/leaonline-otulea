import { Meteor } from 'meteor/meteor'

const contentServer = Meteor.settings.public.hosts.content
const contentRoot = contentServer.url.endsWith('/')
  ? contentServer.url
  : `${contentServer.url}/`

export const fixImageUrl = element => {
  if (element.subtype === 'image') {
    element.value = element.value.replace('https://content.lealernen.de/', contentRoot)
    console.debug('update image value:', element.value)
  }
}
