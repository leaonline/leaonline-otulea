import { Level } from 'meteor/leaonline:corelib/contexts/Level'

// This app is stateless with the UnitSet content, which is why we define it
// only as local collection. The docs will get deleted after caches are emptied.
Level.isLocalCollection = true

export { Level }
