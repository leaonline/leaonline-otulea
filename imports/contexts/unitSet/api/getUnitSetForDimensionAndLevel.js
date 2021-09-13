import { UnitSet } from '../UnitSet'

export const getUnitSetForDimensionAndLevel = ({ dimension, level }) => {
  const query = {}
  if (dimension) {
    query.dimension = dimension
  }
  if (level) {
    query.level = level
  }
  return UnitSet.collection().findOne(query)
}
