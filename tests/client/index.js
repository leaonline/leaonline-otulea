/* eslint-env mocha */

describe('infrastructure', () => {
  require('../infrastructure/factories')
})

describe('routing', () => {
  require('../../imports/ui/routing/tests')
})

describe('ui', () => {
  require('../../imports/ui/components/tests')
  require('../../imports/ui/loading/tests')
  require('../../imports/ui/pages/tests')
  require('../../imports/ui/templates/tests')
})
