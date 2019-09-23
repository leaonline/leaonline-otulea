export const fadeOut = (target, templateInstance, cb) => {
  const $target = templateInstance.$(target)
  if ($target) {
    $target.fadeOut('slow', cb)
  } else {
    cb()
  }
}
