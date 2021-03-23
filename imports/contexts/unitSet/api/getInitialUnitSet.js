import { UnitSet } from '../UnitSet'

export const getInitialUnitSet = ({ dimension, level }) => {
  return UnitSet.collection().findOne({ dimension, level })
}
