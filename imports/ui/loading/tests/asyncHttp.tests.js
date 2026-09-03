/* eslint-env mocha */
import { expect } from 'chai'
import { asyncHTTP } from '../asyncHTTP'
import { createUrl } from '../../../../tests/webapp-server-helpers'
import { expectThrow } from '../../../../tests/helpers.tests'

describe(asyncHTTP.name, () => {
  it('throws an error on missing methods params', async () => {
    await expectThrow({
      fn: asyncHTTP,
      message: 'Method undefined not found',
    })
  })

  it('throws an error on incompatible methods params', async () => {
    await expectThrow({
      fn: () => asyncHTTP('moo'),
      message: 'moo is not a valid HTTP method',
    })
  })

  it('throws an error missing url', async () => {
    await expectThrow({
      fn: () => asyncHTTP('get'),
      message: 'Url undefined not found',
    })
  })
  it('loads content as expected', async () => {
    const url = createUrl('manifest.json')
    const res = await asyncHTTP('get', url)

    expect(res.statusCode).to.equal(200)
    expect(res.headers['content-type']).to.equal(
      'application/json; charset=utf-8',
    )
    expect(res.data.short_name).equal('otu.lea')
  })
})
