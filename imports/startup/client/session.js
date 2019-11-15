import { Template } from 'meteor/templating'
import { Session } from '../../api/session/Session'
import { createCollection } from '../../factories/collection/createCollection'
import { Dimensions } from '../../api/session/Dimensions'
import { Levels } from '../../api/session/Levels'

createCollection(Session)

const _dimensions = Object.values(Dimensions.types)

Template.registerHelper('dimensions', function () {
  return _dimensions
})

const _levels = Object.values(Levels.types)

Template.registerHelper('levels', function () {
  return _levels
})
