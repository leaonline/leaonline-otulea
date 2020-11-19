import { UnitSet } from './UnitSet'

export const getInitialSet = ({ dimension, level }) => {
  return UnitSet.collection().findOne({ dimension, level })
}
