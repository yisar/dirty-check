// Largely inspried by https://github.com/localvoid/ivi/blob/master/packages/ivi/src/core/observable.ts

let clock = 1
let deps = null
const DIRTY_CHECK_TOKEN = Object.freeze({})

export function currentClock() {
  return clock
}

export function advanceClock() {
  clock++
}

export const observable = (v) => ({ t: currentClock(), v })

export function apply(v, fn) {
  v.t = currentClock()
  v.v = fn(v.v)
}

export function assign(v, n) {
  v.t = currentClock()
  v.v = n
}

export const mut = (v) => ((v.t = currentClock()), v.v)

export const signal = () => observable(null)

export function emit(s) {
  s.t = currentClock()
}

export function watch(v) {
  if (deps === null) {
    deps = [currentClock(), v]
  } else {
    deps.push(v)
  }
  return typeof v === 'function' ? v : v.v
}

export function save() {
  const res = deps
  deps = null
  return res
}
export function restore(deps) {
  deps = deps
}
export function check(deps) {
  const t = deps[0]
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