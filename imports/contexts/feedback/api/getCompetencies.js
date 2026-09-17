import { Competency } from '../../Competency'
import { createContentFetcher } from '../../../api/http/createContentFetcher'

const { fetcher } = createContentFetcher({ context: Competency })

export const getCompetencies = (ids) => fetcher(ids)
