import { Competency } from '../../Competency'
import { createContentFetcher } from '../../../api/http/createContentFetcher'

const { fetcher } = createContentFetcher({
  path: Competency.routes.all.path
})

export const getCompetencies = ids => fetcher(ids)
