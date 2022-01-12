import { AlphaLevel } from '../../AlphaLevel'
import { createContentFetcher } from '../../../api/http/createContentFetcher'

const { fetcher } = createContentFetcher({ path: AlphaLevel.routes.all.path })

export const getAlphaLevels = ids => fetcher(ids)
