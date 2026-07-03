export const deprecate = (fn, name) => function (...args) {
  const fnName = name ?? this?.name
  const message = fnName
    ? `${fnName} is deprecated`
    : 'function/method is deprecated'
  console.warn(message)
  return fn.apply(this, args)
}
