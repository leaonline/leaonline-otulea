import { fetchDoc } from '../../../api/http/fetchDoc'
import { AlphaLevel } from '../../AlphaLevel'
import { toContentServerURL } from '../../../api/url/toContentServerURL'

const url = toContentServerURL(AlphaLevel.routes.all.path)

export const getAlphaLevels = ids => {
  const docs = fetchDoc(url, { ids }) || []
  const map = new Map()
  docs.forEach(doc => map.set(doc._id, doc))
  return map
}
