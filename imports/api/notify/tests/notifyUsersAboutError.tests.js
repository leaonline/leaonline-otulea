/* eslint-env mocha */
import { expect } from 'chai'
import { Email } from 'meteor/email'
import { notifyUsersAboutError } from '../notifyUsersAboutError'
import { restoreAll, stub } from '../../../../tests/helpers.tests'

describe(notifyUsersAboutError.name, function () {
  afterEach(function () {
    restoreAll()
  })
  it('skips an undefined error', function () {
    stub(Email, 'send', () => expect.fail())
    notifyUsersAboutError()
  })
  it('sends an email with a stringified error', function () {
    const err = new Error('foobar')
    err.type = 'testError'

    stub(Email, 'send', ({ to, from, replyTo, subject, text }) => {
      expect(to).to.equal('admin@example.com')
      expect(from).to.equal('system@example.com')
      expect(replyTo).to.equal('noreply@example.com')
      expect(subject).to.equal('apps.otulea.title [error]: testError - Error')
      expect(text).to.equal(`<pre><code>${JSON.stringify(err, null, 2)}</code></pre>`)
    })

    notifyUsersAboutError(err)
  })
})
