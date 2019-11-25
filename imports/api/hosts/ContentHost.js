import { check } from 'meteor/check'
import { HTTP } from 'meteor/http'

const content = Meteor.settings.public.hosts.content
const baseUrl = content.base
const competencyUrl = `${baseUrl}${content.competency}`

export const ContentHost = {}

ContentHost.baseUrl = () => baseUrl

ContentHost.methods = {}

ContentHost.methods.getCompetencies = function (competencies, callback) {
  check(competencies, [ String ])
  HTTP.post(competencyUrl, {
    data: { ids: competencies }
  }, (err, res) => {
    if (err) {
      callback(err, null)
    } else {
      const competencies = res.statusCode === 200 && JSON.parse(res.content)
      callback(null, competencies)
    }
  })
}
