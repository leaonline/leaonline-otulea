/* eslint-env mocha */

describe('infrastructure', function () {
  import '../infrastructure/factories'
})

describe('routing', function () {
  import '../../imports/ui/routing/tests'
})

describe('ui', function () {
  import '../../imports/ui/components/tests'
  import '../../imports/ui/loading/tests'
  import '../../imports/ui/pages/tests'
  import '../../imports/ui/templates/tests'
})
