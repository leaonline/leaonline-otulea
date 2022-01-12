import { toContentServerURL } from '../../../api/url/toContentServerURL'
import { Competency } from '../../Competency'
import { fetchDoc } from '../../../api/http/fetchDoc'

const url = toContentServerURL(Competency.routes.all.path)

const cache = new Map()

export const getCompetencies = ids => {
  const docs = fetchDoc(url, { ids }) || []
  const map = new Map()
  docs.forEach(doc => map.set(doc._id, doc))
  return map
}
