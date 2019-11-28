import { Meteor } from 'meteor/meteor'
import { check } from 'meteor/check'
import { HTTP } from 'meteor/http'
import { createLogger } from '../../utils/createLogger'

const logger = createLogger('content')
const content = Meteor.settings.public.hosts.content
const baseUrl = content.base
const competencyUrl = `${baseUrl}${content.competency}`

export const ContentHost = {}

ContentHost.baseUrl = () => baseUrl

ContentHost.methods = {}

ContentHost.methods.getCompetencies = function (competencies, callback) {
  check(competencies, [String])
  logger.debug('get competencies')
  HTTP.post(competencyUrl, {
    data: { ids: competencies }
  }, (err, res) => {
    if (err) {
      logger.error(err)
      callback(err, null)
    } else {
      logger.debug('received result')
      logger.debug('%O', res)
      const competencies = res.statusCode === 200 && JSON.parse(res.content)
      callback(null, competencies)
    }
  })
}
