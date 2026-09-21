/* eslint-env mocha */
import { expect } from 'chai'
import { Renderer } from 'marked'
import { LeaMarkdown } from '../LeaMarkdown'

describe('LeaMarkdown', () => {
  it('returns empty output for missing markdown values', async () => {
    expect(await LeaMarkdown.parse({})).to.equal('')
    expect(await LeaMarkdown.parse({ input: {} })).to.equal('')
  })

  it('creates the selected renderer with input definitions and strips a BOM', async () => {
    const definitions = []
    LeaMarkdown.addRenderer('test-renderer', {
      create(inputDefinitions) {
        definitions.push(inputDefinitions)
        return new Renderer()
      },
    })

    const result = await LeaMarkdown.parse({
      input: { value: '\uFEFFHello', audience: 'learner' },
      renderer: 'test-renderer',
    })

    expect(definitions).to.deep.equal([{ audience: 'learner' }])
    expect(result).to.include('Hello')
    expect(result).not.to.include('\uFEFF')
  })
})
