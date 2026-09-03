/* eslint-env mocha */
describe('patches', () => {
  require('./removeDeadAccounts.tests')
  require('./addDimensionToFeedback.tests')
  require('./generateAccounts.tests')
})
