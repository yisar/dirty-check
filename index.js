let clock = 1
let deps = null

const DIRTY_CHECK_TOKEN = Object.freeze({})

export function clock() {
  return clock
}

export function advanceClock() {
  clock++
}

export const observable = (v) => ({ t: clock(), v })

export function apply(v, fn) {
  v.t = clock()
  v.v = fn(v.v)
}

export function assign(v, n) {
  v.t = clock()
  v.v = n
}

export const mut = (v) => ((v.t = clock()), v.v)

export const signal = () => observable(null)

export function emit(s) {
  s.t = clock()
}
let watchEnabled = 0
export function enableWatch() {
  watchEnabled++
}
export function disableWatch() {
  watchEnabled--
}
export function watch(v) {
  if (deps === null) {
    deps = [clock(), v]
  } else {
    deps.push(v)
  }
  return typeof v === 'function' ? v : v.v
}

export function saveObservableDependencies() {
  const deps = deps
  deps = null
  return deps
}
export function restoreObservableDependencies(deps) {
  deps = deps
}
export function dirtyCheckWatchList(deps) {
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
    const now = clock()
    if (lastCheck < now) {
      lastCheck = now
      if (deps === null || dirtyCheckWatchList(deps) === true) {
        const prevDeps = saveObservableDependencies()
        const nextValue = fn(value)
        deps = saveObservableDependencies()
        restoreObservableDependencies(prevDeps)
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
    const now = clock()
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