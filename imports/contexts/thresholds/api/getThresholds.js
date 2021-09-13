import { Thresholds } from '../Thresholds'
import { fetchDoc } from '../../../api/http/fetchDoc'
import { toContentServerURL } from '../../../api/url/toContentServerURL'

const url = toContentServerURL(Thresholds.routes.all.path)

export const getThresholds = () => fetchDoc(url, {})
