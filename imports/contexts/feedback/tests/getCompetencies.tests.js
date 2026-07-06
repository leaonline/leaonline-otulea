/* eslint-env mocha */
import { expect } from 'chai'
import { Random } from 'meteor/random'
import { getCompetencies } from '../api/getCompetencies'
import { mockCollection, restoreCollection } from '../../../../tests/mockCollection'
import { Competency } from '../../Competency'

describe(getCompetencies.name, async () => {
  before(() => {
    mockCollection(Competency, { attachSchema: false })
  })
  after(() => {
    restoreCollection(Competency)
  })

  it('fetches competency docs by given ids and returns them as a map', async () => {
    const id1 = Random.id()
    const id2 = Random.id()
    const docs = [{
      _id: id1,
      title: Random.id()
    }, {
      _id: id2,
      title: Random.id()
    }]

    for (const doc of docs) {
      await Competency.collection().insertAsync(doc)
    }

    const map = await getCompetencies([id1, id2])
    expect(map.size).to.equal(2)
    expect(map.get(id1)).to.deep.equal(docs[0])
    expect(map.get(id2)).to.deep.equal(docs[1])
  })
})
