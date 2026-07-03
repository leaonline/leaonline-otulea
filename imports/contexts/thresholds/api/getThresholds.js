import { Thresholds } from '../Thresholds'
import { getCollection } from '../../../infrastructure/collections/getCollection'

export const getThresholds = () => getCollection(Thresholds.name).findOneAsync()
