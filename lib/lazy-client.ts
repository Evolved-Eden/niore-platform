export function lazy<T extends object>(factory: () => T): T {
  let instance: T | null = null
  return new Proxy({} as T, {
    get(_target, prop, receiver) {
      if (!instance) instance = factory()
      return Reflect.get(instance as object, prop, receiver)
    },
  })
}