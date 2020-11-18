import { UnitSet } from 'meteor/leaonline:corelib/contexts/UnitSet'
import { onServer, onServerExec } from '../utils/archUtils'

// This app is stateless with the UnitSet content, which is why we define it
// only as local collection. The docs will get deleted after caches are emptied.
UnitSet.isLocalCollection = true

UnitSet.helpers = UnitSet.helpers || {}

function validateDoc (unitSetDoc) {
  if (!unitSetDoc) {
    throw new Meteor.Error('unitSet.showStory.error', 'unitSet.noDoc')
  }
  return unitSetDoc
}

function validateUnits (unitSetDoc) {
  if (!unitSetDoc.units || unitSetDoc.units.length === 0) {
    console.warn('invalid units')
    throw new Meteor.Error('unitSet.showStory.error', 'unitSet.noUnits', { unitSetDoc })
  }
  return unitSetDoc
}

function getValidatedUnitIndex (unitId, unitSetDoc) {
  const index = unitSetDoc.units.indexOf(unitId)
  if (index === -1) {
    throw new Meteor.Error('unitSet.showStory.error', 'unitSet.')
  }
  return index
}

UnitSet.helpers.isFirstUnit = function (unitId, unitSetDoc) {
  validateDoc(unitSetDoc)
  validateUnits(unitSetDoc)

  const index = getValidatedUnitIndex(unitId, unitSetDoc)
  return index === 0
}

UnitSet.helpers.isLastUnit = function (unitId, unitSetDoc) {
  validateDoc(unitSetDoc)
  validateUnits(unitSetDoc)

  const index = getValidatedUnitIndex(unitId, unitSetDoc)
  return index === unitSetDoc.units.length - 1
}

UnitSet.helpers.getNextUnit = function (unitId, unitSetDoc) {
  validateDoc(unitSetDoc)
  validateUnits(unitSetDoc)

  const index = getValidatedUnitIndex(unitId, unitSetDoc)
  if (index === unitSetDoc.units.length - 1) {
    return null
  }

  return unitSetDoc.units[index + 1]
}

UnitSet.helpers.showStory = function (unitId, unitSetDoc) {
  return UnitSet.helpers.isFirstUnit(unitId, unitSetDoc) && (unitSetDoc?.story?.length === 0)
}

UnitSet.helpers.getInitialSet = ({ dimension, level }) => {
  return UnitSet.collection().findOne({ dimension, level })
}

UnitSet.helpers.hasSet = ({ dimension, level }) => {
  const query = {}
  if (dimension) {
    query.dimension = dimension
  }
  if (level) {
    query.level = level
  }
  return UnitSet.collection().findOne(query)
}

export { UnitSet }
