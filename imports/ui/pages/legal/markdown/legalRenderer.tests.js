/* eslint-env mocha */
import { expect } from 'chai'
import sinon from 'sinon'
import { i18n } from '../../../../api/i18n/I18n'
import { legalRenderer } from './legalRenderer'

describe('legalRenderer', () => {
  afterEach(() => sinon.restore())

  it('renders headings and prepares speakable paragraph text', () => {
    const clock = sinon.useFakeTimers()
    sinon.stub(i18n, 'get').callsFake((key) =>
      key.endsWith('paragraphs') ? ' paragraphs ' : ' paragraph ',
    )
    const renderer = legalRenderer()

    expect(renderer.heading('Title')).to.equal(
      '<span class="lea-text-bold">Title</span>',
    )
    const paragraph = renderer.paragraph('One § and §§ <em>markup</em>')
    expect(paragraph).to.include('<span id="sound-0"></span>')
    expect(paragraph).to.include('One § and §§ <em>markup</em>')
    expect(clock.countTimers()).to.equal(1)
  })
})
