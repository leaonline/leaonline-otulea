import { HTTP } from 'meteor/http'
const content = Meteor.settings.public.hosts.content
const baseUrl = content.base
const competencyUrl = `${baseUrl}${content.competency}`

export const ContentHost = {}

ContentHost.baseUrl = () => baseUrl

ContentHost.methods = {}

ContentHost.methods.getCompetencies = function (competencies = []) {
  return new Promise(resolve => {
    HTTP.get(competencyUrl, {
      data: { ids: competencies }
    }, (err, res) => {
      if (err) {
        console.error(err)
        resolve(null)
      } else {
        resolve(res)
      }
    })
  })
}
