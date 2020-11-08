let count = 1
let activeDeps = null

export function clock() {
  return count
}

export function advanceClock() {
  count++
}

export const reactive = (v) => {
  let value = { t: clock(), v }
  return (n) => (n ? set(value, n) : get(value))
}

export function restore(deps) {
  activeDeps = deps
}

export function set(v, n) {
  v.t = clock()
  v.v = n
  const deps = depsMap.get(v)
  console.log(deps)
  deps.forEach((d) => d())
}

export function get(v) {
  if (activeDeps === null) {
    activeDeps = [clock(), v]
  } else {
    activeDeps.push(v)
  }
  return typeof v === 'function' ? v : v.v
}

export function dirtyCheck(deps) {
  const t = deps[0]
  for (let i = 1; i < deps.length; i++) {
    const v = deps[i]
    if (typeof v === 'object') {
      if (v.t > t) {
        return true
      }
    } else if (v(true, t) === true) {
      return true
    }
  }
  return false
}

export function save() {
  const deps = activeDeps
  activeDeps = null
  return deps
}

export function computed(fn) {
  let lastdirtyCheck = 0
  let lastUpdate = 0
  let value = void 0
  let deps = null
  return (token, time) => {
    const now = clock()
    if (lastdirtyCheck < now) {
      lastdirtyCheck = now
      if (deps === null || dirtyCheck(deps) === true) {
        const prevDeps = save()
        const nextValue = fn(value)
        deps = save()
        restore(prevDeps)
        if (value !== nextValue) {
          value = nextValue
          lastUpdate = now
        }
      }
    }
    return token ? lastUpdate > time : value
  }
}

export function selector(fn) {
  let lastdirtyCheck = 0
  let lastUpdate = 0
  let value = void 0
  return () => {
    const now = clock()
    if (lastdirtyCheck < now) {
      lastdirtyCheck = now
      const nextValue = fn(value)
      if (value !== nextValue) {
        value = nextValue
        lastUpdate = now
      }
    }
    return token ? lastUpdate > time : value
  }
}
