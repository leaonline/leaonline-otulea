import { Meteor } from 'meteor/meteor'
import { check } from 'meteor/check'
import { HTTP } from 'meteor/http'
import { createInfoLog } from '../errors/createInfoLog'

const content = Meteor.settings.public.hosts.content
const baseUrl = content.base
const competencyUrl = `${baseUrl}${content.competency}`

export const ContentHost = {}

ContentHost.name = 'ContentHost'

ContentHost.baseUrl = () => baseUrl

ContentHost.methods = {}

const info = createInfoLog(ContentHost)

ContentHost.methods.getCompetencies = function (competencies, callback) {
  check(competencies, [String])
  info('get competencies')
  HTTP.post(competencyUrl, {
    data: { ids: competencies }
  }, (err, res) => {
    if (err) {
      console.error(err)
      callback(err, null)
    }
    else {
      info('received result')
      const competencies = res.statusCode === 200 && JSON.parse(res.content)
      callback(null, competencies)
    }
  })
}
