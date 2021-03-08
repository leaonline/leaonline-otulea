let debug = false

global.isDebugUser = function (value) {
  if (typeof value !== 'undefined') {
    debug = !!value
  }

  return debug
}
