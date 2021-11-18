/* eslint-env mocha */
import { expect } from 'chai'
import { Random } from 'meteor/random'
import { asyncHTTP } from '../asyncHTTP'
import { createUrl, urls } from '../../../../tests/webapp-server-helpers'
import { expectThrow } from '../../../../tests/helpers.tests'

describe(asyncHTTP.name, function () {
  it('throws an error on missing methods params', async function () {
    const e = await expectThrow(function () {
      return asyncHTTP()
    })
    expect(e.message).to.equal('Match error: Expected string, got undefined in field method')
  })

  it('throws an error on incompatible methods params', async function () {
    const e = await expectThrow(function () {
      return asyncHTTP('', Random.id())
    })
    expect(e.message).to.equal('Failed to execute \'open\' on \'XMLHttpRequest\': \'\' is not a valid HTTP method.')
  })

  it('throws an error missing params', async function () {
    const e = await expectThrow(function () {
      return asyncHTTP('get')
    })
    expect(e.message).to.equal('Match error: Expected string, got undefined in field url')
  })
  it('loads content as expected', async function () {
    const url = createUrl('manifest.json')
    const res = await asyncHTTP('get', url)

    expect(res.statusCode).to.equal(200)
    expect(res.headers['content-type']).to.equal('application/json; charset=UTF-8')
    expect(res.data.short_name).equal('otu.lea')
  })
  it('responds with respective error message if expected', async function () {
    const url400 = createUrl(urls.path400)
    const e400 = await expectThrow(function () {
      return asyncHTTP('get', url400)
    })
    // console.debug(res)
    expect(e400.message).to.equal('failed [400] not found')
  })
})
