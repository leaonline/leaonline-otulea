/* eslint-env mocha */
import { Errors } from '../Errors'

describe(Errors.name, function () {
  import './normalizeError.tests'
  import './persistError.tests'
  import './crud.tests'
})
