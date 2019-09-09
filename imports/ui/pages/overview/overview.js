import { Template } from 'meteor/templating'
import { Dimensions } from '../../../api/session/Dimensions'
import { Levels } from '../../../api/session/Levels'
import { dataTarget } from '../../../utils/eventUtils'
import '../../components/soundbutton/soundbutton'
import '../../components/actionButton/actionButton'
import '../../components/text/text'
import './overview.scss'
import './overview.html'

const dimensions = Object.values(Dimensions)
const levels = Object.values(Levels)

Template.overview.helpers({
  // ---------------------- // ----------------------
  // DIMENSIONS
  // ---------------------- // ----------------------
  dimensions () {
    return dimensions
  },
  dimensionSelected () {
    return Template.getState('dimension')
  },
  isSelectedDimension (name) {
    const dimension = Template.getState('dimension')
    return dimension && dimension.name === name
  },
  // ---------------------- // ----------------------
  // LEVELS
  // ---------------------- // ----------------------
  levels () {
    return levels
  },
  levelSelected () {
    return Template.getState('level')
  },
  isSelectedLevel (name) {
    const level = Template.getState('level')
    return level && level.name === name
  },
  dimensionLevel () {
    const instance = Template.instance()
    const dimension = instance.state.get('dimension')
    const level = instance.state.get('level')
    return level && dimension && dimension.descriptions[ level.name ]
  }
})

Template.overview.events({
  'click .lea-dimension-button' (event, templateInstance) {
    event.preventDefault()
    const dimensionName = dataTarget(event, templateInstance, 'dimension')
    templateInstance.state.set('dimension', Dimensions[ dimensionName ])
  },
  'click .lea-back-button' (event, templateInstance) {
    event.preventDefault()
    templateInstance.state.set('dimension', null)
    templateInstance.state.set('level', null)
  },
  'click .lea-level-button' (event, templateInstance) {
    event.preventDefault()
    const levelName = dataTarget(event, templateInstance, 'level')
    templateInstance.state.set('level', Levels[ levelName ])
  }
})
