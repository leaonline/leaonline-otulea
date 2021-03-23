import { getType } from './getType'

export const isPlainObject = x => getType(x) === '[object Object]'
