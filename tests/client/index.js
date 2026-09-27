/* eslint-env mocha */

describe('infrastructure', function () {
  require('../infrastructure/factories')
})

describe('routing', function () {
  require('../../imports/ui/routing/tests/triggers.tests')
})

describe('ui', function () {
  require('../../imports/ui/components/tests')
  require('../../imports/ui/loading/tests')
  require('../../imports/ui/pages/tests')
})
