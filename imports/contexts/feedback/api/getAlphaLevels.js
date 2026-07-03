import { AlphaLevel } from '../../AlphaLevel'
import { createContentFetcher } from '../../../api/http/createContentFetcher'

const { fetcher } = createContentFetcher({ context: AlphaLevel })

export const getAlphaLevels = ids => fetcher(ids)
