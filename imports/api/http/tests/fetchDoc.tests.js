/* eslint-env mocha */
import { expect } from 'chai'
import { HTTP } from 'meteor/jkuester:http'
import sinon from 'sinon'
import { fetchDoc } from '../fetchDoc'

describe('fetchDoc', () => {
  afterEach(() => sinon.restore())

  it('passes parameters and safe request headers to HTTP.get', async () => {
    const response = { data: { _id: 'document' } }
    const get = sinon.stub(HTTP, 'get').resolves(response)
    sinon.stub(console, 'debug')

    expect(await fetchDoc('https://content.example.test/doc', { q: 'one' })).to.equal(
      response.data,
    )
    expect(get.calledOnce).to.equal(true)
    expect(get.firstCall.args[0]).to.equal('https://content.example.test/doc')
    expect(get.firstCall.args[1]).to.deep.include({ params: { q: 'one' } })
    expect(get.firstCall.args[1].headers).to.include({
      mode: 'cors',
      cache: 'no-store',
    })
    expect(get.firstCall.args[1].headers.origin).to.be.a('string')
  })

  it('propagates transport failures', async () => {
    const expected = new Error('offline')
    sinon.stub(HTTP, 'get').rejects(expected)
    sinon.stub(console, 'debug')

    let error
    try {
      await fetchDoc('https://content.example.test/doc')
    } catch (caught) {
      error = caught
    }
    expect(error).to.equal(expected)
  })
})
