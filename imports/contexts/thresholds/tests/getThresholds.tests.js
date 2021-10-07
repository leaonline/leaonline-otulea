/* eslint-env mocha */
import { expect } from 'chai'
import { HTTP } from 'meteor/http'
import { getThresholds } from '../api/getThresholds'
import { stub, restoreAll } from '../../../../tests/helpers.tests'
import { toContentServerURL } from '../../../api/url/toContentServerURL'
import { Thresholds } from '../Thresholds'

describe(getThresholds.name, function () {
  afterEach(function () {
    restoreAll()
  })
  it('calls the external server for all thresholds', function () {
    const expected = [{ foo: Math.random().toString(10) }]
    stub(HTTP, 'get', function (url, options) {
      expect(url).to.equal(toContentServerURL(Thresholds.routes.all.path))
      expect(options.params).to.deep.equal({})
      return { data: expected }
    })

    const actual = getThresholds()
    expect(actual).to.deep.equal(expected)
  })
})
