export const ContentServer = {}

const contentUrl = Meteor.settings.public.hosts.content.url
const connection = DDP.connect(contentUrl)

ContentServer.isAvailable = () => connection.status().connected
