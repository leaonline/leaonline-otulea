export const fadeOut = (target, templateInstance, cb) => {
  templateInstance.$(target).fadeOut('slow', cb)
}
