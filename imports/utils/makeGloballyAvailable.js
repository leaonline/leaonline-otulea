import { onClientExec } from './archUtils'
export const makeGloballyAvailable = (dict, { force = false } = {}) => {
  onClientExec(() => {
    for (const [key, value] of Object.entries(dict)) {
        if (force || !Object.prototype.hasOwnProperty.call(value, key)) {
            window[key] = value
        }
    }
  })
}
