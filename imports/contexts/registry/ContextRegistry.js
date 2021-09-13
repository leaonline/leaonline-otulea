const store = new Map()

export const ContextRegistry = {}

ContextRegistry.add = (name, ctx) => store.set(name, ctx)
ContextRegistry.get = name => store.get(name)
