/* eslint-env mocha */
import { expect } from 'chai'
import sinon from 'sinon'
import { i18n } from '../../../api/i18n/I18n'
import { createIssuesLink } from './createIssuesLink'

describe('createIssuesLink', () => {
  afterEach(() => sinon.restore())

  it('creates an encoded mailto link from translations and the current URL', () => {
    sinon.stub(i18n, 'get').callsFake((key, data) =>
      key === 'issues.subject' ? 'Report issue' : `Visited ${data.url}`,
    )

    const result = createIssuesLink({ url: 'https://example.test/path?a=1' })
    expect(result).to.equal(
      'mailto:tests@example.com?subject=Report%20issue&body=Visited%20https%3A%2F%2Fexample.test%2Fpath%3Fa%3D1',
    )
  })
})
