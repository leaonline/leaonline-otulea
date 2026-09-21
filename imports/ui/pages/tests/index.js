/* eslint-env mocha */
describe('pages', () => {
  require('./adapters.tests')
  require('./smallAdapters.tests')
  require('../../layout/footer/createIssuesLink.tests')
  require('../complete/tests')
  require('../legal/markdown/legalRenderer.tests')
  require('../overview/tests')
  require('../story/tests')
  require('../unit/tests')
  require('../welcome/tests')
})
