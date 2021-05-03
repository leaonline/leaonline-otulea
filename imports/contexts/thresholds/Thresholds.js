import { Thresholds } from 'meteor/leaonline:corelib/contexts/Thresholds'

// This app is stateless with the UnitSet content, which is why we define it
// only as local collection. The docs will get deleted after caches are emptied.
Thresholds.isLocalCollection = true

export { Thresholds }
