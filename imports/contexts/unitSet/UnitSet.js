import { UnitSet } from 'meteor/leaonline:corelib/contexts/UnitSet'

// This app is stateless with the UnitSet content, which is why we define it
// only as local collection. The docs will get deleted after caches are emptied.
UnitSet.isLocalCollection = true

export { UnitSet }
