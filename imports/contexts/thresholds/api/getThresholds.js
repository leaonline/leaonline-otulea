import { Thresholds } from '../Thresholds'

export const getThresholds = () => Thresholds.collection().findOneAsync()
