export const createInfoLog = name => {
  const infoName = `[${name}]:`
  return (...args) => {
    args.unshift(infoName)
    console.info.apply(console, args)
  }
}
