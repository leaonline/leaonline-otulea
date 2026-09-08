/**
 * A simple wrapper around require() that
 * can be invoked multiple times but only requires the
 * actual module once.
 * Make sure you properly deconstruct the module when requiring.
 * @param fn {function}
 * @return {function(): *}
 */
export const lazyRequire = (fn) => {
  let value = null
  return () => {
    if (value === null) {
      value = fn()
    }
    return value
  }
}
