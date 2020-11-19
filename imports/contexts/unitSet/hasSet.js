import { UnitSet } from './UnitSet'

export const hasSet = ({ dimension, level }) => {
  const query = {}
  if (dimension) {
    query.dimension = dimension
  }
  if (level) {
    query.level = level
  }
  return UnitSet.collection().findOne(query)
}
