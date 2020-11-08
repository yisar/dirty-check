let clock = 1
let deps = null
let depsMap = new Map()
const effectStack = []
const DIRTY_CHECK_TOKEN = Object.freeze({})

export function currentClock() {
  return clock
}

export function advanceClock() {
  clock++
}

export const reactive = (v) => {
  let value = { t: currentClock(), v }
  return (n) => (n ? set(value, n) : get(value))
}

export function apply(v, fn) {
  v.t = currentClock()
  v.v = fn(v.v)
}

export function set(v, n) {
  v.t = currentClock()
  v.v = n
  const deps = depsMap.get(v)
  console.log(deps)
  deps.forEach((d) => d())
}

export function get(v) {
  const e = effectStack[effectStack.length - 1]
  let deps = depsMap.get(v)
  if (!deps) {
    deps = new Set([currentClock])
    depsMap.set(v, deps)
  }
  if (!deps.has(e)) {
    deps.add(e)
  }
  return typeof v === 'function' ? v : v.v
}

export function check(deps) {
  const t = deps[0]()
  for (let i = 1; i < deps.length; i++) {
    const v = deps[i]
    if (typeof v === 'object') {
      if (v.t > t) {
        return true
      }
    } else if (v(DIRTY_CHECK_TOKEN, t) === true) {
      return true
    }
  }
  return false
}

export function computed(fn) {
  let lastCheck = 0
  let lastUpdate = 0
  let value = void 0
  let deps = null
  return (token, time) => {
    const now = currentClock()
    if (lastCheck < now) {
      lastCheck = now
      if (deps === null || check(deps) === true) {
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
    return token === DIRTY_CHECK_TOKEN ? lastUpdate > time : value
  }
}

export function selector(fn) {
  let lastCheck = 0
  let lastUpdate = 0
  let value = void 0
  return (token, time) => {
    const now = currentClock()
    if (lastCheck < now) {
      lastCheck = now
      const nextValue = fn(value)
      if (value !== nextValue) {
        value = nextValue
        lastUpdate = now
      }
    }
    return token === DIRTY_CHECK_TOKEN ? lastUpdate > time : value
  }
}

export function autorun(fn) {
  const effect = function (...args) {
    try {
      effectStack.push(effect)
      return fn(args)
    } finally {
      effectStack.pop()
    }
  }
  return effect()
}
