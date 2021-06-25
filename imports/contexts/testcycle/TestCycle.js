import { TestCycle } from 'meteor/leaonline:corelib/contexts/TestCycle'

// This app is stateless with the UnitSet content, which is why we define it
// only as local collection. The docs will get deleted after caches are emptied.
TestCycle.isLocalCollection = true

export { TestCycle }
